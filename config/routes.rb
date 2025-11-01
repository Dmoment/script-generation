Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Grape API
  mount V1::Base => '/api'
  mount GrapeSwaggerRails::Engine => '/api/docs'

  # API/Auth endpoints (must be before catch-all)
  get '/auth/auth0/callback', to: 'sessions#callback'
  get '/auth/failure', to: 'sessions#failure'
  delete '/logout', to: 'sessions#logout'
  get '/current_user', to: 'sessions#current'

  # Root path
  root "pages#index"

  # Catch-all route for React Router (must be absolute last)
  # This allows React Router to handle all routes client-side
  get '*path', to: 'pages#index', constraints: ->(req) {
    !req.xhr? && req.format.html?
  }
end
