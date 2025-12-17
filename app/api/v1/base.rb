# frozen_string_literal: true

require "grape-swagger"

module V1
  class Base < BaseApi
    version "v1", using: :path

    mount V1::UsersApi
    mount V1::ProjectsApi
    mount V1::OnboardingApi
    mount V1::ProjectTypesApi

    # Add Swagger documentation
    add_swagger_documentation(
      api_version: "v1",
      hide_documentation_path: false,
      mount_path: "swagger_doc",
      info: {
        title: "Script Generation API",
        description: "API for script generation and management platform",
        version: "1.0.0",
        contact: {
          name: "API Support",
          email: "support@scriptgeneration.com"
        }
      }
    )
  end
end
