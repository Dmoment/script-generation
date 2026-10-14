# frozen_string_literal: true

# Development/test-only login bypass so the app can be driven end to end
# (browser automation, local QA) without an Auth0 session.
#
# Enabled only when BOTH hold:
#   * Rails.env is development or test
#   * DEV_AUTH_BYPASS=1 is set in the server's environment
#
# With it on, the API accepts `Authorization: Bearer dev-bypass-token` as the
# test user below, and the layout tells the frontend to use a stub session.
# Production never loads this path: the env check is hard-coded.
class DevAuthBypass
  TOKEN = "dev-bypass-token"
  EMAIL = "dev.tester@localhost"

  def self.enabled?
    (Rails.env.development? || Rails.env.test?) && ENV["DEV_AUTH_BYPASS"] == "1"
  end

  def self.token?(token)
    enabled? && token == TOKEN
  end

  # DEV_AUTH_BYPASS_EMAIL overrides the identity, so a brand-new user (first-run
  # experience) can be exercised as well as the seeded tester.
  def self.email
    ENV["DEV_AUTH_BYPASS_EMAIL"].presence || EMAIL
  end

  def self.user_info
    { auth0_id: "dev|#{email.parameterize}", email: email, name: email == EMAIL ? "Dev Tester" : "New Writer", picture: nil }
  end
end
