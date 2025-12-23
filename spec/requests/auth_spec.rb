require 'rails_helper'

RSpec.describe 'Auth routes', type: :request do
  it 'routes failure to return JSON error' do
    get '/auth/failure'
    expect(response).to have_http_status(:unauthorized)
    json = JSON.parse(response.body)
    expect(json).to have_key('error')
  end
end
