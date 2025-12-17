# frozen_string_literal: true

module V1
  class ProjectTypesApi < Grape::API
    resource :project_types do
      desc "Search project types", {
        success: V1::Entities::ProjectType,
        is_array: true,
        failure: [
          { code: 401, message: "Unauthorized" }
        ]
      }
      params do
        optional :q, type: String, desc: "Search query"
        optional :limit, type: Integer, default: 20, desc: "Maximum number of results"
      end
      get do
        authenticate!

        project_types = ProjectType.all

        # Search if query provided
        if params[:q].present?
          project_types = project_types.search(params[:q])
        end

        # Order by name alphabetically
        project_types = project_types.order(name: :asc).limit(params[:limit])

        present project_types, with: V1::Entities::ProjectType
      end

      desc "Create a new project type", {
        success: V1::Entities::ProjectType,
        failure: [
          { code: 401, message: "Unauthorized" },
          { code: 422, message: "Validation failed" }
        ]
      }
      params do
        requires :name, type: String, desc: "Project type name"
      end
      post do
        authenticate!

        # Find or create (case-insensitive)
        normalized_name = params[:name].strip
        project_type = ProjectType.where("LOWER(name) = ?", normalized_name.downcase).first_or_initialize

        if project_type.new_record?
          project_type.name = normalized_name
        end

        if project_type.save
          present project_type, with: V1::Entities::ProjectType
        else
          error!({ error: "Validation failed", details: project_type.errors.full_messages }, 422)
        end
      end

    end
  end
end
