# frozen_string_literal: true

require 'jwt'
require 'net/http'
require 'uri'
require 'json'

class Auth0TokenValidator
  AUTH0_DOMAIN = ENV.fetch('AUTH0_DOMAIN')
  AUTH0_AUDIENCE = ENV.fetch('AUTH0_AUDIENCE', "https://#{AUTH0_DOMAIN}/api/v2/")

  def initialize(token)
    @token = token
  end

  def validate!
    decoded_token
  end

  def user_info
    @user_info ||= begin
      payload = decoded_token
      profile = enrich_profile(payload)
      email = profile['email'].presence || "#{payload['sub']}@auth0.local"

      {
        auth0_id: payload['sub'],
        email: email,
        name: profile['name'] || profile['nickname'] || email || payload['sub'],
        picture: profile['picture']
      }
    end
  end

  private

  def decoded_token
    @decoded_token ||= begin
      JWT.decode(
        @token,
        nil,
        true,
        {
          algorithm: 'RS256',
          iss: "https://#{AUTH0_DOMAIN}/",
          verify_iss: true,
          aud: AUTH0_AUDIENCE,
          verify_aud: true,
          jwks: jwks
        }
      ).first
    end
  rescue JWT::DecodeError => e
    raise "Invalid token: #{e.message}"
  end

  def enrich_profile(payload)
    if payload['email'].present? && payload['name'].present?
      payload
    else
      fetch_user_profile.merge(payload) { |_key, fetched, original| fetched || original }
    end
  end

  def fetch_user_profile
    uri = URI("https://#{AUTH0_DOMAIN}/userinfo")
    request = Net::HTTP::Get.new(uri)
    request['Authorization'] = "Bearer #{@token}"

    response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
      http.request(request)
    end

    unless response.is_a?(Net::HTTPSuccess)
      raise "Failed to fetch user profile from Auth0: #{response.code} #{response.message}"
    end

    JSON.parse(response.body)
  rescue StandardError => e
    raise "Failed to fetch user profile from Auth0: #{e.message}"
  end

  def jwks
    @jwks ||= begin
      jwks_uri = URI("https://#{AUTH0_DOMAIN}/.well-known/jwks.json")
      response = Net::HTTP.get_response(jwks_uri)
      JSON.parse(response.body, symbolize_names: true)
    end
  end
end
