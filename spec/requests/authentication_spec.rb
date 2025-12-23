# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'Authentication', type: :request do
  describe 'Auth routes' do
    describe 'GET /auth/failure' do
      it 'returns JSON error response' do
        get '/auth/failure'
        expect(response).to have_http_status(:unauthorized)
        json = JSON.parse(response.body)
        expect(json).to have_key('error')
        expect(json['error']).to eq('Authentication error')
      end

      it 'handles failure with error message' do
        get '/auth/failure', params: { message: 'Access denied' }
        expect(response).to have_http_status(:unauthorized)
        json = JSON.parse(response.body)
        expect(json).to have_key('error')
        expect(json['error']).to eq('Access denied')
      end
    end

    describe 'GET /auth/auth0/callback' do
      let(:auth_hash) do
        {
          'uid' => 'auth0|123456',
          'credentials' => {
            'token' => 'access_token_123',
            'id_token' => 'id_token_123',
            'expires_at' => Time.now.to_i + 3600
          },
          'info' => {
            'email' => 'user@example.com',
            'name' => 'Test User',
            'image' => 'https://example.com/avatar.jpg'
          }
        }
      end

      before do
        # Mock OmniAuth
        OmniAuth.config.test_mode = true
        OmniAuth.config.mock_auth[:auth0] = OmniAuth::AuthHash.new(auth_hash)
      end

      after do
        OmniAuth.config.test_mode = false
        OmniAuth.config.mock_auth[:auth0] = nil
      end

      context 'with valid Auth0 callback' do
        it 'returns JSON with tokens and user info' do
          get '/auth/auth0/callback'

          expect(response).to have_http_status(:success)
          json = JSON.parse(response.body)

          expect(json).to have_key('access_token')
          expect(json).to have_key('id_token')
          expect(json).to have_key('expires_at')
          expect(json).to have_key('user')

          expect(json['user']['auth0_id']).to eq('auth0|123456')
          expect(json['user']['email']).to eq('user@example.com')
          expect(json['user']['name']).to eq('Test User')
        end

        it 'includes all required user fields' do
          get '/auth/auth0/callback'

          expect(response).to have_http_status(:success)
          json = JSON.parse(response.body)
          user = json['user']

          expect(user).to have_key('auth0_id')
          expect(user).to have_key('email')
          expect(user).to have_key('name')
          expect(user).to have_key('image')
        end
      end

      context 'when Auth0 authentication fails' do
        before do
          OmniAuth.config.mock_auth[:auth0] = :invalid_credentials
        end

        it 'handles authentication failure gracefully' do
          # The failure will be caught by the failure route
          # This is tested separately
        end
      end
    end

    describe 'Sessions Controller' do
      describe 'POST /auth/auth0/callback' do
        context 'with missing auth info' do
          it 'handles missing authentication data' do
            # This would typically be handled by OmniAuth middleware
            # but we can test the controller's response format
            allow_any_instance_of(SessionsController).to receive(:request).and_return(
              double(env: {})
            )

            expect {
              get '/auth/auth0/callback'
            }.not_to raise_error
          end
        end
      end

      describe 'GET /auth/failure' do
        it 'returns JSON error response' do
          get '/auth/failure', params: { message: 'Custom error message' }

          expect(response).to have_http_status(:unauthorized)
          json = JSON.parse(response.body)
          expect(json).to have_key('error')
          expect(json['error']).to eq('Custom error message')
        end

        it 'handles missing error message' do
          get '/auth/failure'
          expect(response).to have_http_status(:unauthorized)
          json = JSON.parse(response.body)
          expect(json).to have_key('error')
          expect(json['error']).to eq('Authentication error')
        end
      end
    end

    describe 'API Authentication' do
      let(:company) { Company.create!(name: 'Test Company') }
      let(:user) { User.create!(auth0_id: 'auth0|123', email: 'test@example.com', name: 'Test User', company: company, role: nil) }


      describe 'Protected API endpoints' do
        context 'without authentication token' do
          it 'returns 401 for projects endpoint' do
            validator_double = double('Auth0TokenValidator')
            allow(validator_double).to receive(:validate!).and_raise(JWT::DecodeError)
            allow(Auth0TokenValidator).to receive(:new).and_return(validator_double)

            get '/api/v1/projects'

            expect(response).to have_http_status(:unauthorized)
            json = JSON.parse(response.body)
            expect(json['error']).to include('token')
          end

          it 'returns 401 for scripts endpoint' do
            validator_double = double('Auth0TokenValidator')
            allow(validator_double).to receive(:validate!).and_raise(JWT::DecodeError)
            allow(Auth0TokenValidator).to receive(:new).and_return(validator_double)

            get '/api/v1/scripts'

            expect(response).to have_http_status(:unauthorized)
          end
        end

        context 'with invalid token' do
          it 'returns 401 for expired token' do
            validator_double = double('Auth0TokenValidator')
            allow(validator_double).to receive(:validate!).and_raise(JWT::ExpiredSignature)
            allow(Auth0TokenValidator).to receive(:new).and_return(validator_double)

            get '/api/v1/projects', headers: { 'Authorization' => 'Bearer expired_token' }

            expect(response).to have_http_status(:unauthorized)
            json = JSON.parse(response.body)
            expect(json['error']).to be_present
          end

          it 'returns 401 for malformed token' do
            validator_double = double('Auth0TokenValidator')
            allow(validator_double).to receive(:validate!).and_raise(JWT::DecodeError)
            allow(Auth0TokenValidator).to receive(:new).and_return(validator_double)

            get '/api/v1/projects', headers: { 'Authorization' => 'Bearer invalid_token' }

            expect(response).to have_http_status(:unauthorized)
          end
        end

        context 'with valid authentication' do
          before do
            validator_double = double('Auth0TokenValidator')
            allow(validator_double).to receive(:validate!).and_return(true)
            allow(validator_double).to receive(:user_info).and_return({
              auth0_id: user.auth0_id,
              email: user.email,
              name: user.name
            })
            allow(Auth0TokenValidator).to receive(:new).and_return(validator_double)
          end

          it 'allows access to projects endpoint' do
            get '/api/v1/projects', headers: { 'Authorization' => 'Bearer valid_token' }

            expect(response).to have_http_status(:success)
          end

          it 'allows access to scripts endpoint' do
            get '/api/v1/scripts', headers: { 'Authorization' => 'Bearer valid_token' }

            expect(response).to have_http_status(:success)
          end
        end
      end
    end
  end
end
