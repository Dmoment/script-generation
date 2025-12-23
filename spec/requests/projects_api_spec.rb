# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Projects API', type: :request do
  let(:company) { Company.create!(name: 'Test Company') }
  let(:user) { User.create!(auth0_id: 'auth0|123', email: 'test@example.com', name: 'Test User', company: company, role: nil) }
  let(:token) { 'valid_token' }
  let(:headers) { { 'Authorization' => "Bearer #{token}" } }

  before do
    # Set up access controls so user can access their company's projects
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

  describe 'GET /api/v1/projects' do
    context 'when authenticated' do
      it 'returns all accessible projects' do
        project = Project.create!(
          title: 'Test Project',
          project_type: 'film',
          company: company,
          created_by_user: user,
          status: 'active'
        )

        get '/api/v1/projects', headers: headers

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        # API returns paginated response with 'data' key
        expect(json).to have_key('data')
        expect(json['data']).to be_an(Array)
        expect(json['data'].first['id']).to eq(project.id)
      end

      it 'supports pagination' do
        25.times do |i|
          Project.create!(
            title: "Project #{i}",
            project_type: 'film',
            company: company,
            created_by_user: user,
            status: 'active'
          )
        end

        get '/api/v1/projects', params: { page: 1, per_page: 10 }, headers: headers

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['data']).to be_an(Array)
        expect(json['data'].length).to be <= 10
      end

      it 'supports Ransack filtering' do
        Project.create!(title: 'Film Project', project_type: 'film', company: company, created_by_user: user, status: 'active')
        Project.create!(title: 'Series Project', project_type: 'series', company: company, created_by_user: user, status: 'active')

        get '/api/v1/projects', params: { q: { project_type_eq: 'film' } }, headers: headers

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['data']).to be_an(Array)
        expect(json['data'].all? { |p| p['project_type'] == 'film' }).to be true
      end
    end

    context 'when not authenticated' do
      it 'returns 401 unauthorized' do
        validator_double = double('Auth0TokenValidator')
        allow(validator_double).to receive(:validate!).and_raise(JWT::DecodeError)
        allow(Auth0TokenValidator).to receive(:new).and_return(validator_double)

        get '/api/v1/projects'

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'GET /api/v1/projects/:id' do
    let(:project) do
      Project.create!(
        title: 'Test Project',
        project_type: 'film',
        company: company,
        created_by_user: user,
        status: 'active'
      )
    end

    context 'when authenticated and authorized' do
      it 'returns the project' do
        get "/api/v1/projects/#{project.id}", headers: headers

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['id']).to eq(project.id)
        expect(json['title']).to eq('Test Project')
      end
    end

    context 'when project does not exist' do
      it 'returns 404' do
        get '/api/v1/projects/99999', headers: headers

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'POST /api/v1/projects' do
    context 'with valid parameters' do
      it 'creates a new project' do
        project_params = {
          title: 'New Project',
          project_type: 'film',
          description: 'A test project',
          status: 'draft'
        }

        expect {
          post '/api/v1/projects', params: project_params.to_json, headers: headers.merge('Content-Type' => 'application/json')
        }.to change(Project, :count).by(1)

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['title']).to eq('New Project')
        expect(json['project_type']).to eq('film')
        expect(json['status']).to eq('draft')
      end

      it 'sets default status to draft if not provided' do
        project_params = {
          title: 'New Project',
          project_type: 'film'
        }

        post '/api/v1/projects', params: project_params.to_json, headers: headers.merge('Content-Type' => 'application/json')

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['status']).to eq('draft')
      end

      it 'associates project with user company' do
        project_params = {
          title: 'New Project',
          project_type: 'film'
        }

        post '/api/v1/projects', params: project_params.to_json, headers: headers.merge('Content-Type' => 'application/json')

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        project = Project.find(json['id'])
        expect(project.company_id).to eq(company.id)
        expect(project.created_by_user_id).to eq(user.id)
      end
    end

    context 'with invalid parameters' do
      it 'returns 422 with validation errors for empty title' do
        project_params = {
          title: '',
          project_type: 'film'
        }

        post '/api/v1/projects', params: project_params.to_json, headers: headers.merge('Content-Type' => 'application/json')

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json).to have_key('error')
      end

      it 'returns 400 for invalid status' do
        project_params = {
          title: 'New Project',
          project_type: 'film',
          status: 'invalid_status'
        }

        post '/api/v1/projects', params: project_params.to_json, headers: headers.merge('Content-Type' => 'application/json')

        # Grape validates enum values before model validation, returns 400
        expect(response).to have_http_status(:bad_request)
      end

      it 'returns 422 when user has no company' do
        user_without_company = User.create!(auth0_id: 'auth0|456', email: 'nocompany@example.com', name: 'No Company User', role: nil)
        validator_double = double('Auth0TokenValidator')
        allow(validator_double).to receive(:validate!).and_return(true)
        allow(validator_double).to receive(:user_info).and_return({
          auth0_id: user_without_company.auth0_id,
          email: user_without_company.email,
          name: user_without_company.name
        })
        allow(Auth0TokenValidator).to receive(:new).and_return(validator_double)

        project_params = {
          title: 'New Project',
          project_type: 'film'
        }

        post '/api/v1/projects', params: project_params.to_json, headers: headers.merge('Content-Type' => 'application/json')

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json['error']).to include('company')
      end
    end
  end

  describe 'PUT /api/v1/projects/:id' do
    let(:project) do
      Project.create!(
        title: 'Test Project',
        project_type: 'film',
        company: company,
        created_by_user: user,
        status: 'draft'
      )
    end

    context 'with valid parameters' do
      it 'updates the project' do
        update_params = {
          title: 'Updated Project',
          status: 'active',
          description: 'Updated description'
        }

        put "/api/v1/projects/#{project.id}", params: update_params.to_json, headers: headers.merge('Content-Type' => 'application/json')

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['title']).to eq('Updated Project')
        expect(json['status']).to eq('active')
        expect(json['description']).to eq('Updated description')

        project.reload
        expect(project.title).to eq('Updated Project')
        expect(project.status).to eq('active')
      end
    end

    context 'with invalid parameters' do
      it 'returns 422 with validation errors' do
        update_params = {
          title: '' # Invalid: empty title
        }

        put "/api/v1/projects/#{project.id}", params: update_params.to_json, headers: headers.merge('Content-Type' => 'application/json')

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json).to have_key('error')
      end
    end

    context 'when project does not exist' do
      it 'returns 404' do
        update_params = { title: 'Updated Project' }

        put '/api/v1/projects/99999', params: update_params.to_json, headers: headers.merge('Content-Type' => 'application/json')

        if response.status == 500
          puts "Error: #{response.body}"
        end
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'DELETE /api/v1/projects/:id' do
    let(:project) do
      Project.create!(
        title: 'Test Project',
        project_type: 'film',
        company: company,
        created_by_user: user,
        status: 'active'
      )
    end

    context 'when authenticated and authorized' do
      it 'deletes the project' do
        project_id = project.id
        expect {
          delete "/api/v1/projects/#{project_id}", headers: headers
        }.to change(Project, :count).by(-1)

        if response.status != 200
          puts "Response status: #{response.status}"
          puts "Response body: #{response.body}"
        end
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['success']).to be true
        expect(json['message']).to include('deleted successfully')
      end

      it 'cascades delete to associated scripts' do
        script = Script.create!(
          title: 'Test Script',
          script_type: 'screenplay',
          project: project,
          created_by_user: user,
          status: 'active'
        )

        expect {
          delete "/api/v1/projects/#{project.id}", headers: headers
        }.to change(Script, :count).by(-1)
      end
    end

    context 'when project does not exist' do
      it 'returns 404' do
        delete '/api/v1/projects/99999', headers: headers

        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
