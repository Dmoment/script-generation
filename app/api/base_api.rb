# frozen_string_literal: true

class BaseApi < Grape::API
  format :json
  # prefix :api  # Removed - we mount at /api in routes.rb instead

  # Global error handling
  rescue_from :all do |e|
    error_response = case e
    when Grape::Exceptions::ValidationErrors
      {
        error: "Validation failed",
        details: e.errors
      }
    when Grape::Exceptions::MethodNotAllowed
      {
        error: "Method not allowed"
      }
    else
      Rails.logger.error "API Error: #{e.class} - #{e.message}"
      Rails.logger.error e.backtrace.join("\n") if Rails.env.development?

      {
        error: Rails.env.production? ? "Internal server error" : e.message
      }
    end

    status_code = case e
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
    def current_user
      # Get user from session (you can modify this based on your auth)
      @current_user ||= begin
        user_id = session[:user_id]
        User.find_by(id: user_id) if user_id
      end
    end

    def authenticate!
      error!("Unauthorized", 401) unless current_user
    end

    def session
      env["rack.session"]
    end
  end
end
