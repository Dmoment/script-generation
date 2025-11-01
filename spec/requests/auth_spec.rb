require 'rails_helper'

RSpec.describe 'Auth routes', type: :request do
  it 'routes failure to root' do
    get '/auth/failure'
    expect(response).to redirect_to(root_path)
  end
end

