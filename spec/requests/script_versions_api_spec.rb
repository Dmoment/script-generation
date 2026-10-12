# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Script versions API', type: :request do
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

    version.scenes.create!(scene_number: 1, order: 1, elements: [
      { 'type' => 'slugline', 'text' => 'INT. KITCHEN - NIGHT' },
      { 'type' => 'character', 'text' => 'MIRA', 'extensions' => ['V.O.'] },
      { 'type' => 'dialogue', 'text' => 'Not again.' }
    ])
    version.scenes.create!(scene_number: 2, order: 2, elements: [
      { 'type' => 'slugline', 'text' => 'EXT. PIER - DAWN' },
      { 'type' => 'action', 'text' => 'Gulls.' }
    ])
  end

  describe 'GET /api/v1/script_versions/:id/export' do
    it 'downloads a Final Draft file' do
      get "/api/v1/script_versions/#{version.id}/export", params: { file_format: 'fdx' }, headers: headers

      expect(response).to have_http_status(:success)
      expect(response.headers['Content-Type']).to include('application/xml')
      expect(response.headers['Content-Disposition']).to eq('attachment; filename="the-kettle-v1.fdx"')
      expect(response.body).to include('<FinalDraft', '<Text>MIRA (V.O.)</Text>', 'Type="Scene Heading" Number="2"')
    end

    it 'downloads a Fountain file' do
      get "/api/v1/script_versions/#{version.id}/export", params: { file_format: 'fountain' }, headers: headers

      expect(response).to have_http_status(:success)
      expect(response.headers['Content-Disposition']).to eq('attachment; filename="the-kettle-v1.fountain"')
      expect(response.body).to start_with('Title: The Kettle')
      expect(response.body).to include("MIRA (V.O.)\nNot again.")
    end

    it 'rejects unknown formats' do
      get "/api/v1/script_versions/#{version.id}/export", params: { file_format: 'docx' }, headers: headers
      expect(response).to have_http_status(:bad_request)
    end
  end

  describe 'POST /api/v1/script_versions/:id/import' do
    it 'replaces the scenes with the uploaded screenplay' do
      file = Rack::Test::UploadedFile.new(file_fixture('sample.fdx'), 'application/xml')
      post "/api/v1/script_versions/#{version.id}/import", params: { file: file }, headers: headers

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['scenes_count']).to eq(3)
      expect(json['format']).to eq('fdx')
      expect(version.scenes.ordered.map(&:slugline)).to eq([nil, 'INT. KITCHEN - NIGHT', 'EXT. PIER - DAWN'])
    end

    it 'returns 422 for files it cannot parse' do
      file = Rack::Test::UploadedFile.new(StringIO.new('%PDF-1.4'), 'application/pdf', original_filename: 'x.pdf')
      post "/api/v1/script_versions/#{version.id}/import", params: { file: file }, headers: headers

      expect(response).to have_http_status(:unprocessable_entity)
      expect(version.scenes.count).to eq(2)
    end
  end

  describe 'PUT /api/v1/script_versions/:id/reorder_scenes' do
    it 'renumbers scenes to follow the given order' do
      first, second = version.scenes.ordered.to_a
      put "/api/v1/script_versions/#{version.id}/reorder_scenes", params: { scene_ids: [second.id, first.id] }, headers: headers

      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json.map { |s| [s['id'], s['scene_number'], s['order']] }).to eq([[second.id, 1, 1], [first.id, 2, 2]])
    end

    it 'rejects an incomplete id list' do
      first = version.scenes.ordered.first
      put "/api/v1/script_versions/#{version.id}/reorder_scenes", params: { scene_ids: [first.id] }, headers: headers
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end
end
