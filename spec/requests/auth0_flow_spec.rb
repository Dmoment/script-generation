require 'rails_helper'

RSpec.describe 'Auth0 flow', type: :request do
  before do
    OmniAuth.config.test_mode = true
    OmniAuth.config.mock_auth[:auth0] = OmniAuth::AuthHash.new(
      provider: 'auth0',
      uid: 'auth0|123',
      info: { email: 'user@example.com', name: 'Test User', image: 'https://example.com/a.png' }
    )
  end

  it 'stores minimal profile in session on callback' do
    get '/auth/auth0/callback'
    expect(response).to redirect_to(root_path)
    follow_redirect!
    expect(session[:user].keys).to include('uid', 'email', 'name')
    expect(session[:user]['email']).to eq('user@example.com')
  end

  it 'clears session on logout' do
    get '/auth/auth0/callback'
    delete '/logout'
    expect(response).to redirect_to(root_path)
    follow_redirect!
    expect(session[:user]).to be_nil
  end
end
