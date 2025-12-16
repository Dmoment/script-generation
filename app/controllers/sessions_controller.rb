class SessionsController < ApplicationController
  protect_from_forgery except: :callback

  def callback
    auth_info = request.env["omniauth.auth"]

    # Return tokens to frontend (for future use if needed)
    render json: {
      access_token: auth_info.credentials.token,
      id_token: auth_info.credentials.id_token,
      expires_at: auth_info.credentials.expires_at,
      user: {
        auth0_id: auth_info["uid"],
        email: auth_info.dig("info", "email"),
        name: auth_info.dig("info", "name"),
        image: auth_info.dig("info", "image")
      }
    }
  end

  def failure
    render json: { error: params[:message] || "Authentication error" }, status: :unauthorized
  end
end
