# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Scripts API', type: :request do
  let(:company) { Company.create!(name: 'Test Company') }
  let(:user) { User.create!(auth0_id: 'auth0|123', email: 'test@example.com', name: 'Test User', company: company, role: nil) }
  let(:project) { Project.create!(title: 'Test Project', project_type: 'film', company: company, created_by_user: user, status: 'active') }
  let(:token) { 'valid_token' }
  let(:headers) { { 'Authorization' => "Bearer #{token}" } }

  before do
    # Set up access controls so user can access their own project
    # User created the project, but we also ensure they have company access
    AccessControl.find_or_create_by(user: user, company: company, role: 'company_admin')

    # Mock Auth0TokenValidator - stub before it's instantiated
    validator_double = double('Auth0TokenValidator')
    allow(validator_double).to receive(:validate!).and_return(true)
    allow(validator_double).to receive(:user_info).and_return({
      auth0_id: user.auth0_id,
      email: user.email,
      name: user.name
    })
    allow(Auth0TokenValidator).to receive(:new).and_return(validator_double)
  end

  describe 'GET /api/v1/scripts' do
    context 'when authenticated' do
      it 'returns all accessible scripts' do
        script = Script.create!(
          title: 'Test Script',
          script_type: 'screenplay',
          project: project,
          created_by_user: user,
          status: 'active'
        )

        get '/api/v1/scripts', headers: headers

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        # API returns paginated response with 'data' key
        expect(json).to have_key('data')
        expect(json['data']).to be_an(Array)
        expect(json['data'].first['id']).to eq(script.id)
      end

      it 'filters scripts by project_id' do
        other_project = Project.create!(title: 'Other Project', project_type: 'film', company: company, created_by_user: user)
        script1 = Script.create!(title: 'Script 1', script_type: 'screenplay', project: project, created_by_user: user, status: 'active')
        script2 = Script.create!(title: 'Script 2', script_type: 'screenplay', project: other_project, created_by_user: user, status: 'active')

        get '/api/v1/scripts', params: { project_id: project.id }, headers: headers

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['data']).to be_an(Array)
        expect(json['data'].length).to eq(1)
        expect(json['data'].first['id']).to eq(script1.id)
      end

      it 'supports pagination' do
        25.times do |i|
          Script.create!(
            title: "Script #{i}",
            script_type: 'screenplay',
            project: project,
            created_by_user: user,
            status: 'active'
          )
        end

        get '/api/v1/scripts', params: { page: 1, per_page: 10 }, headers: headers

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['data']).to be_an(Array)
        expect(json['data'].length).to be <= 10
      end
    end

    context 'when not authenticated' do
      it 'returns 401 unauthorized' do
        validator_double = double('Auth0TokenValidator')
        allow(validator_double).to receive(:validate!).and_raise(JWT::DecodeError)
        allow(Auth0TokenValidator).to receive(:new).and_return(validator_double)

        get '/api/v1/scripts'

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'GET /api/v1/scripts/:id' do
    let(:script) do
      Script.create!(
        title: 'Test Script',
        script_type: 'screenplay',
        project: project,
        created_by_user: user,
        status: 'active'
      )
    end

    context 'when authenticated and authorized' do
      it 'returns the script' do
        get "/api/v1/scripts/#{script.id}", headers: headers

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['id']).to eq(script.id)
        expect(json['title']).to eq('Test Script')
      end
    end

    context 'when script does not exist' do
      it 'returns 404' do
        get '/api/v1/scripts/99999', headers: headers

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'POST /api/v1/scripts' do
    context 'with valid parameters' do
      it 'creates a new script' do
        script_params = {
          project_id: project.id,
          title: 'New Script',
          script_type: 'screenplay',
          description: 'A test script'
        }

        expect {
          post '/api/v1/scripts', params: script_params.to_json, headers: headers.merge('Content-Type' => 'application/json')
        }.to change(Script, :count).by(1)

        if response.status != 200
          puts "Response status: #{response.status}"
          puts "Response body: #{response.body}"
        end
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['title']).to eq('New Script')
        expect(json['script_type']).to eq('screenplay')
      end

      it 'creates an initial scene' do
        script_params = {
          project_id: project.id,
          title: 'New Script',
          script_type: 'screenplay'
        }

        post '/api/v1/scripts', params: script_params.to_json, headers: headers.merge('Content-Type' => 'application/json')

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        script = Script.find(json['id'])
        script_version = script.script_versions.first
        expect(script_version.scenes.count).to eq(1)
        expect(script_version.scenes.first.slugline).to eq('INT. LOCATION - DAY')
      end
    end

    context 'with invalid parameters' do
      it 'returns 422 with validation errors' do
        script_params = {
          project_id: project.id,
          title: '', # Invalid: empty title
          script_type: 'screenplay'
        }

        post '/api/v1/scripts', params: script_params.to_json, headers: headers.merge('Content-Type' => 'application/json')

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json).to have_key('error')
      end

      it 'requires project_id' do
        script_params = {
          title: 'New Script',
          script_type: 'screenplay'
        }

        post '/api/v1/scripts', params: script_params.to_json, headers: headers.merge('Content-Type' => 'application/json')

        expect(response).to have_http_status(:bad_request)
      end
    end
  end

  describe 'DELETE /api/v1/scripts/:id' do
    let(:script) do
      Script.create!(
        title: 'Test Script',
        script_type: 'screenplay',
        project: project,
        created_by_user: user,
        status: 'active'
      )
    end

    context 'when authenticated and authorized' do
      it 'deletes the script' do
        script_id = script.id
        expect {
          delete "/api/v1/scripts/#{script_id}", headers: headers
        }.to change(Script, :count).by(-1)

        if response.status != 200
          puts "Response status: #{response.status}"
          puts "Response body: #{response.body}"
        end
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['message']).to include('deleted successfully')
      end
    end

    context 'when script does not exist' do
      it 'returns 404' do
        delete '/api/v1/scripts/99999', headers: headers

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'DELETE /api/v1/script_versions/:id' do
    let(:script) do
      s = Script.create!(
        title: 'Test Script',
        script_type: 'screenplay',
        project: project,
        created_by_user: user,
        status: 'active'
      )
      # Create initial version
      s.script_versions.create!(version_number: 1, notes: 'Initial version')
      s
    end
    let(:script_version) { script.script_versions.first }

    context 'when deleting version 1' do
      it 'deletes the entire script' do
        script_id = script.id
        version_id = script_version.id
        expect {
          delete "/api/v1/script_versions/#{version_id}", headers: headers
        }.to change(Script, :count).by(-1)

        if response.status != 200
          puts "Response status: #{response.status}"
          puts "Response body: #{response.body}"
        end
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['message']).to include('Script deleted successfully')
      end
    end

    context 'when deleting version > 1' do
      let!(:version_2) do
        ScriptVersion.create!(
          script: script,
          version_number: 2,
          notes: 'Version 2'
        )
      end

      it 'deletes only that version' do
        script_count_before = Script.count
        version_count_before = ScriptVersion.count
        delete "/api/v1/script_versions/#{version_2.id}", headers: headers

        expect(ScriptVersion.count).to eq(version_count_before - 1)
        expect(Script.count).to eq(script_count_before)

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['message']).to include('Script version deleted successfully')
      end
    end
  end
end
