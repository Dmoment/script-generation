Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Render dynamic PWA files from app/views/pwa/* (remember to link manifest in application.html.erb)
  # get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
  # get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker

  # Grape API
  mount V1::Base => "/api"
  mount GrapeSwaggerRails::Engine => "/api/docs"

  # Auth0 callback - returns JSON with tokens (must be before catch-all)
  get "/auth/auth0/callback", to: "sessions#callback"
  get "/auth/failure", to: "sessions#failure"

  # Root path
  root "pages#index"

  # Catch-all route for React Router (must be absolute last)
  # This allows React Router to handle all routes client-side
  # Serve the SPA shell for page requests, including clients that ask for */*
  # (link-preview crawlers, mail apps opening a review link). Asset-style
  # requests with an extension (.js, .png, .json) still fall through to 404.
  get "*path", to: "pages#index", constraints: ->(req) {
    !req.xhr? && (req.format.html? || req.format == Mime::ALL)
  }
end
