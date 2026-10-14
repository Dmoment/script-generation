# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Script drafts, comparison and breakdown API', type: :request do
  let(:company) { Company.create!(name: 'Test Company') }
  let(:user) { User.create!(auth0_id: 'auth0|123', email: 'test@example.com', name: 'Test User', company: company, role: nil) }
  let(:project) { Project.create!(title: 'Test Project', project_type: 'film', company: company, created_by_user: user, status: 'active') }
  let(:script) { Script.create!(title: 'The Kettle', script_type: 'screenplay', project: project, created_by_user: user, status: 'active') }
  let(:v1) { script.script_versions.create!(version_number: 1) }
  let(:headers) { { 'Authorization' => 'Bearer valid_token' } }

  before do
    AccessControl.find_or_create_by(user: user, company: company, role: 'company_admin')
    validator_double = double('Auth0TokenValidator')
    allow(validator_double).to receive(:validate!).and_return(true)
    allow(validator_double).to receive(:user_info).and_return(auth0_id: user.auth0_id, email: user.email, name: user.name)
    allow(Auth0TokenValidator).to receive(:new).and_return(validator_double)

    v1.scenes.create!(scene_number: 1, order: 1, elements: [
      { 'type' => 'slugline', 'text' => 'INT. KITCHEN - NIGHT' },
      { 'type' => 'action', 'text' => 'A kettle screams.' },
      { 'type' => 'character', 'text' => 'MIRA', 'extensions' => [ 'V.O.' ] },
      { 'type' => 'dialogue', 'text' => 'Not again.' }
    ], metadata: { 'breakdown' => { 'props' => [ 'kettle', 'radio' ], 'sfx' => [ 'steam' ] } })
    v1.scenes.create!(scene_number: 2, order: 2, elements: [
      { 'type' => 'slugline', 'text' => 'EXT. PIER - DAWN' },
      { 'type' => 'action', 'text' => 'Gulls.' }
    ], metadata: { 'breakdown' => { 'props' => [ 'kettle' ], 'vehicles' => [ 'ferry' ] } })
  end

  describe 'POST /api/v1/scripts/:id/versions' do
    it 'copies the latest version into a new draft with lineage' do
      post "/api/v1/scripts/#{script.id}/versions", params: { notes: 'Second draft' }, headers: headers

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['version_number']).to eq(2)
      expect(json['notes']).to eq('Second draft')

      v2 = script.script_versions.find(json['id'])
      expect(v2.scenes.count).to eq(2)
      expect(v2.scenes.ordered.map(&:slugline)).to eq([ 'INT. KITCHEN - NIGHT', 'EXT. PIER - DAWN' ])
      expect(v2.scenes.ordered.first.metadata['source_scene_id']).to eq(v1.scenes.ordered.first.id)
      expect(v2.scenes.ordered.first.metadata['breakdown']['props']).to eq([ 'kettle', 'radio' ])
    end
  end

  describe 'GET /api/v1/script_versions/:id/compare' do
    it 'reports changed, added, removed and unchanged scenes with element-level diffs' do
      v2 = Screenplay::VersionCloner.new(script, notes: 'v2').call
      kitchen, pier = v2.scenes.ordered.to_a
      # change a line, reorder, add a scene, remove one
      kitchen.update!(elements: kitchen.elements.map { |e| e['text'] == 'Not again.' ? e.merge('text' => 'Not again, Baba.') : e })
      pier.destroy!
      v2.scenes.create!(scene_number: 3, order: 3, elements: [ { 'type' => 'slugline', 'text' => 'INT. HOLD - DAY' }, { 'type' => 'action', 'text' => 'Dark.' } ])

      get "/api/v1/script_versions/#{v2.id}/compare", params: { with: v1.id }, headers: headers

      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json['summary']).to eq('changed' => 1, 'added' => 1, 'removed' => 1)
      changed = json['scenes'].find { |s| s['status'] == 'changed' }
      ops = changed['changes'].map { |c| [ c['op'], c['element']['text'] ] }
      expect(ops).to include([ 'del', 'Not again.' ], [ 'add', 'Not again, Baba.' ], [ 'same', 'A kettle screams.' ])
      expect(json['scenes'].find { |s| s['status'] == 'removed' }['slugline']).to eq('EXT. PIER - DAWN')
      expect(json['scenes'].find { |s| s['status'] == 'added' }['slugline']).to eq('INT. HOLD - DAY')
    end

    it 'matches by lineage even after scenes are reordered and renumbered' do
      v2 = Screenplay::VersionCloner.new(script, notes: 'v2').call
      kitchen, pier = v2.scenes.ordered.to_a
      kitchen.update_columns(scene_number: -1)
      pier.update_columns(scene_number: 1, order: 1)
      kitchen.update_columns(scene_number: 2, order: 2)

      get "/api/v1/script_versions/#{v2.id}/compare", params: { with: v1.id }, headers: headers
      json = JSON.parse(response.body)
      expect(json['summary']).to eq('unchanged' => 2)
    end

    it 'refuses versions of different scripts' do
      other = Script.create!(title: 'Other', project: project, created_by_user: user)
      ov = other.script_versions.create!(version_number: 1)
      get "/api/v1/script_versions/#{v1.id}/compare", params: { with: ov.id }, headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe 'GET /api/v1/script_versions/:id/revisions' do
    it 'lists scenes revised since the previous draft' do
      v2 = Screenplay::VersionCloner.new(script).call
      kitchen = v2.scenes.ordered.first
      kitchen.update!(elements: kitchen.elements + [ { 'type' => 'action', 'text' => 'New beat.' } ])

      get "/api/v1/script_versions/#{v2.id}/revisions", headers: headers
      json = JSON.parse(response.body)
      expect(json['previous_version']['version_number']).to eq(1)
      expect(json['changed_scene_ids']).to eq([ kitchen.id ])
    end

    it 'is empty for the first draft' do
      get "/api/v1/script_versions/#{v1.id}/revisions", headers: headers
      expect(JSON.parse(response.body)).to eq('previous_version' => nil, 'changed_scene_ids' => [], 'changed_row_ids' => [])
    end
  end

  describe 'GET /api/v1/script_versions/:id/breakdown' do
    it 'aggregates cast from the script and tagged items per category' do
      get "/api/v1/script_versions/#{v1.id}/breakdown", headers: headers
      json = JSON.parse(response.body)
      props = json['categories'].find { |c| c['key'] == 'props' }['items']
      expect(props).to eq([ { 'name' => 'kettle', 'scene_numbers' => [ 1, 2 ] }, { 'name' => 'radio', 'scene_numbers' => [ 1 ] } ])
      cast = json['categories'].find { |c| c['key'] == 'cast' }['items']
      expect(cast).to eq([ { 'name' => 'MIRA', 'scene_numbers' => [ 1 ] } ])
      expect(json['scenes'].first['items']['sfx']).to eq([ 'steam' ])
    end

    it 'exports CSV' do
      get "/api/v1/script_versions/#{v1.id}/breakdown", params: { file_format: 'csv' }, headers: headers
      expect(response.headers['Content-Type']).to include('text/csv')
      expect(response.body).to include("Category,Item,Scenes,Scene count", "Props,kettle,1 2,2", "Vehicles,ferry,2,1")
    end
  end
end
