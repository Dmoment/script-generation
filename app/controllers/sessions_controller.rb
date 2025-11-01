class SessionsController < ApplicationController
  protect_from_forgery except: :callback

  def callback
    auth_info = request.env['omniauth.auth']
    session[:user] = {
      uid: auth_info['uid'],
      email: auth_info.dig('info', 'email'),
      name: auth_info.dig('info', 'name'),
      image: auth_info.dig('info', 'image')
    }
    redirect_to root_path, notice: 'Signed in'
  end

  def failure
    redirect_to root_path, alert: params[:message] || 'Authentication error'
  end

  def logout
    reset_session
    redirect_to root_path, notice: 'Signed out'
  end

  def current
    if session[:user]
      render json: session[:user]
    else
      head :no_content
    end
  end
end
