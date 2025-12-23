# frozen_string_literal: true

class BaseApi < Grape::API
  include Paginatable
  include MultipartParams

  helpers do
    def authorize(record, query = nil)
      query ||= params[:action].to_s + '?'
      Pundit.authorize(current_user, record, query)
    rescue Pundit::NotAuthorizedError => e
      error!({ error: e.message || "Access denied" }, 403)
    end

    def policy_scope(scope)
      Pundit.policy_scope(current_user, scope)
    end
  end
  format :json

  # Global error handling
  rescue_from :all do |e|
    error_response = case e
    when JWT::DecodeError, JWT::ExpiredSignature
      { error: "Invalid or expired token" }
    when ActiveRecord::RecordNotFound
      { error: "#{e.model || 'Record'} not found" }
    when Grape::Exceptions::ValidationErrors
      error_details = e.errors.is_a?(Hash) ? e.errors.map { |k, v| "#{k}: #{v.join(', ')}" }.join("; ") : e.errors.to_s
      Rails.logger.error "Grape validation errors: #{error_details}"
      { error: "Validation failed: #{error_details}", details: e.errors }
    when Grape::Exceptions::MethodNotAllowed
      { error: "Method not allowed" }
    else
      Rails.logger.error "API Error: #{e.class} - #{e.message}"
      Rails.logger.error e.backtrace.join("\n") if Rails.env.development?
      { error: Rails.env.production? ? "Internal server error" : e.message }
    end

    status_code = case e
    when JWT::DecodeError, JWT::ExpiredSignature
      401
    when ActiveRecord::RecordNotFound
      404
    when Grape::Exceptions::ValidationErrors
      400
    when Grape::Exceptions::MethodNotAllowed
      405
    else
      500
    end

    error!(error_response, status_code)
  end

  # Helper methods available to all API endpoints
  helpers do
    # Extract token from Authorization header
    def token_from_header
      auth_header = headers["Authorization"]
      return nil unless auth_header

      # Format: "Bearer <token>"
      auth_header.split(" ").last if auth_header.start_with?("Bearer ")
    end

    # Validate token and return user info
    def validate_token!
      token = token_from_header
      error!("No token provided", 401) unless token

      validator = Auth0TokenValidator.new(token)
      validator.validate!
      validator.user_info
    rescue => e
      error!("Token validation failed: #{e.message}", 401)
    end

    # Get or create user from token
    def current_user
      @current_user ||= begin
        user_info = validate_token!
        Rails.logger.info "User info: #{user_info.inspect}"

        user = if user_info[:auth0_id].present?
          User.find_by(auth0_id: user_info[:auth0_id])
        end

        user ||= User.find_by(email: user_info[:email]) if user_info[:email].present?

        user ||= User.new

        # Update user info on each request (keeps data fresh)
        # If found by email but auth0_id was missing, update it
        user.assign_attributes(
          auth0_id: user_info[:auth0_id] || user.auth0_id,
          email: user_info[:email],
          name: user_info[:name],
          role: nil,
        )

        user.save!
        user
      end
    end

    # Require authentication
    def authenticate!
      current_user # This will raise error if token is invalid
    end
  end
end
