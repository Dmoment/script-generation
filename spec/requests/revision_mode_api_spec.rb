# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Revision mode API', type: :request do
  let(:company) { Company.create!(name: 'Test Company') }
  let(:user) { User.create!(auth0_id: 'auth0|123', email: 'test@example.com', name: 'Test User', company: company, role: nil) }
  let(:project) { Project.create!(title: 'Test Project', project_type: 'film', company: company, created_by_user: user, status: 'active') }
  let(:script) { Script.create!(title: 'The Kettle', script_type: 'screenplay', project: project, created_by_user: user, status: 'active') }
  let(:version) { script.script_versions.create!(version_number: 1) }
  let(:headers) { { 'Authorization' => 'Bearer valid_token' } }

  before do
    AccessControl.find_or_create_by(user: user, company: company, role: 'company_admin')
    validator_double = double('Auth0TokenValidator')
    allow(validator_double).to receive(:validate!).and_return(true)
    allow(validator_double).to receive(:user_info).and_return(auth0_id: user.auth0_id, email: user.email, name: user.name)
    allow(Auth0TokenValidator).to receive(:new).and_return(validator_double)

    3.times do |i|
      version.scenes.create!(scene_number: i + 1, order: i + 1, elements: [
        { 'type' => 'slugline', 'text' => "INT. ROOM #{i + 1} - DAY" },
        { 'type' => 'action', 'text' => "Beat #{i + 1}." }
      ])
    end
  end

  def labels
    version.scenes.ordered.reload.map(&:scene_label)
  end

  describe 'locking scene numbers' do
    it 'freezes labels, letters inserts and keeps labels across reorder' do
      put "/api/v1/script_versions/#{version.id}/lock_numbers", params: { locked: true }, headers: headers
      expect(response).to have_http_status(:success)
      expect(JSON.parse(response.body)['scene_numbers_locked_at']).to be_present
      expect(labels).to eq(%w[1 2 3])

      second = version.scenes.ordered.second
      post '/api/v1/scenes', params: { script_version_id: version.id, scene_number: 99, after_scene_id: second.id, slugline: 'EXT. YARD - DAY' }, headers: headers
      expect(response).to have_http_status(:created)
      expect(JSON.parse(response.body)['scene_label']).to eq('2A')
      expect(labels).to eq(%w[1 2 2A 3])

      post '/api/v1/scenes', params: { script_version_id: version.id, scene_number: 100, after_scene_id: second.id, slugline: 'EXT. YARD - LATER' }, headers: headers
      expect(JSON.parse(response.body)['scene_label']).to eq('2B')
      expect(labels).to eq(%w[1 2 2B 2A 3])

      ids = version.scenes.ordered.reload.map(&:id).reverse
      put "/api/v1/script_versions/#{version.id}/reorder_scenes", params: { scene_ids: ids }, headers: headers
      expect(labels).to eq(%w[3 2A 2B 2 1])
    end

    it 'turns a deleted scene into an OMITTED placeholder while locked, and really deletes when unlocked' do
      put "/api/v1/script_versions/#{version.id}/lock_numbers", params: { locked: true }, headers: headers
      target = version.scenes.ordered.second
      delete "/api/v1/scenes/#{target.id}", headers: headers
      expect(response).to have_http_status(:success)
      expect(JSON.parse(response.body)['omitted']).to be(true)
      expect(labels).to eq(%w[1 2 3])
      expect(target.reload.elements).to eq([])
      expect(target.omitted?).to be(true)

      put "/api/v1/script_versions/#{version.id}/lock_numbers", params: { locked: false }, headers: headers
      expect(labels).to eq(%w[1 2 3])
      delete "/api/v1/scenes/#{target.id}", headers: headers
      expect(response).to have_http_status(:no_content)
      expect(version.scenes.count).to eq(2)
    end

    it 'inserts after a scene with open numbering by renumbering the rest' do
      first = version.scenes.ordered.first
      post '/api/v1/scenes', params: { script_version_id: version.id, scene_number: 0, after_scene_id: first.id, slugline: 'INT. HALL - DAY' }, headers: headers
      expect(response).to have_http_status(:created)
      expect(version.scenes.ordered.reload.map { |s| [ s.scene_number, s.slugline ] }).to eq([ [ 1, 'INT. ROOM 1 - DAY' ], [ 2, 'INT. HALL - DAY' ], [ 3, 'INT. ROOM 2 - DAY' ], [ 4, 'INT. ROOM 3 - DAY' ] ])
    end
  end

  describe 'revision colours' do
    it 'advances the colour on each locked draft' do
      put "/api/v1/script_versions/#{version.id}/lock_numbers", params: { locked: true }, headers: headers
      put "/api/v1/script_versions/#{version.id}", params: { revision_color: 'white', revision_date: '2026-10-13' }, headers: headers
      expect(JSON.parse(response.body)['revision_color_label']).to eq('White')

      post "/api/v1/scripts/#{script.id}/versions", headers: headers
      v2 = JSON.parse(response.body)
      expect(v2['revision_color']).to eq('blue')
      expect(v2['scene_numbers_locked_at']).to be_present
      expect(ScriptVersion.find(v2['id']).scenes.ordered.map(&:scene_label)).to eq(%w[1 2 3])
    end

    it 'rejects unknown colours' do
      put "/api/v1/script_versions/#{version.id}", params: { revision_color: 'mauve' }, headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it 'wraps the sequence into double colours' do
      expect(Screenplay::RevisionColors.next_after('cherry')).to eq('double white')
      expect(Screenplay::RevisionColors.next_after('double white')).to eq('double blue')
      expect(Screenplay::RevisionColors.next_after(nil)).to eq('white')
    end
  end

  describe 'scene comments' do
    let(:scene) { version.scenes.ordered.first }

    it 'creates threads, replies, resolves and lists them' do
      post "/api/v1/scenes/#{scene.id}/comments", params: { body: 'Too slow here', element_id: 'el-1' }, headers: headers
      expect(response).to have_http_status(:created)
      root = JSON.parse(response.body)
      expect(root['author']['name']).to eq('Test User')

      post "/api/v1/scenes/#{scene.id}/comments", params: { body: 'Agreed, cut a line', parent_id: root['id'] }, headers: headers
      thread = JSON.parse(response.body)
      expect(thread['id']).to eq(root['id'])
      expect(thread['replies'].map { |r| r['body'] }).to eq([ 'Agreed, cut a line' ])

      put "/api/v1/scenes/#{scene.id}/comments/#{root['id']}/resolve", params: { resolved: true }, headers: headers
      expect(JSON.parse(response.body)['resolved_at']).to be_present

      get "/api/v1/scenes/#{scene.id}/comments", headers: headers
      list = JSON.parse(response.body)
      expect(list.size).to eq(1)
      expect(list.first['replies'].size).to eq(1)
    end

    it 'refuses replies to replies and empty bodies' do
      root = scene.comments.create!(user: user, body: 'root')
      reply = scene.comments.create!(user: user, body: 'reply', parent: root)
      post "/api/v1/scenes/#{scene.id}/comments", params: { body: 'nested', parent_id: reply.id }, headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
      post "/api/v1/scenes/#{scene.id}/comments", params: { body: '   ' }, headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it 'only lets the author delete' do
      other = User.create!(auth0_id: 'auth0|other', email: 'other@example.com', name: 'Other', company: company, role: nil)
      comment = scene.comments.create!(user: other, body: 'not yours')
      delete "/api/v1/scenes/#{scene.id}/comments/#{comment.id}", headers: headers
      expect(response).to have_http_status(:forbidden)
      mine = scene.comments.create!(user: user, body: 'mine')
      delete "/api/v1/scenes/#{scene.id}/comments/#{mine.id}", headers: headers
      expect(response).to have_http_status(:no_content)
    end
  end
end
