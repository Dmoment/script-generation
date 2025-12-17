# frozen_string_literal: true

module V1
  class ProjectsApi < Grape::API
    resource :projects do
      desc "Get all projects", {
        success: V1::Entities::Project,
        is_array: true,
        failure: [
          { code: 401, message: "Unauthorized" }
        ]
      }
      params do
        optional :page, type: Integer, default: 1, desc: "Page number"
        optional :per_page, type: Integer, default: 20, desc: "Items per page"
        optional :q, type: Hash, desc: "Ransack search/filter parameters"
      end
      get do
        authenticate!

        # Only show projects from user's company
        user_company = current_user.company
        error!({ error: "User must belong to a company" }, 422) unless user_company

        projects = Project.where(company_id: user_company.id)

        # Apply Ransack search/filtering if q parameter is provided
        if params[:q].present?
          projects = projects.ransack(params[:q]).result
        end

        # Use Kaminari for pagination
        paginated_projects = projects.page(params[:page]).per(params[:per_page])

        # Return paginated response with metadata
        {
          data: paginated_projects.map { |p| V1::Entities::Project.represent(p) },
          pagination: {
            page: paginated_projects.current_page,
            per_page: paginated_projects.limit_value,
            total: paginated_projects.total_count,
            total_pages: paginated_projects.total_pages,
            has_next: paginated_projects.next_page.present?,
            has_prev: paginated_projects.prev_page.present?
          }
        }
      end

      desc "Get a specific project", {
        success: V1::Entities::Project,
        failure: [
          { code: 401, message: "Unauthorized" },
          { code: 404, message: "Project not found" }
        ]
      }
      params do
        requires :id, type: Integer, desc: "Project ID"
      end
      get ":id" do
        authenticate!
        project = Project.find(params[:id])
        present project, with: V1::Entities::Project
      end

      desc "Create a new project", {
        success: V1::Entities::Project,
        failure: [
          { code: 401, message: "Unauthorized" },
          { code: 422, message: "Validation failed" }
        ]
      }
      params do
        requires :title, type: String, desc: "Project title"
        requires :project_type, type: String, desc: "Project type (e.g., film, series, short, ad, documentary, or custom)"
        optional :description, type: String, desc: "Project description"
        optional :status, type: String, values: %w[draft active locked archived], default: "draft", desc: "Project status"
        optional :budget, type: Float, desc: "Project budget"
      end
      post do
        authenticate!

        # Get user's company (required for project creation)
        user_company = current_user.company
        error!({ error: "User must belong to a company" }, 422) unless user_company

        # Create project with minimal required fields
        project = Project.new(
          title: params[:title],
          project_type: params[:project_type],
          company_id: user_company.id,
          created_by_user_id: current_user.id,
          status: params[:status] || 'draft',
          stage: params[:stage] || 'idea',
          language: params[:language] || 'en'
        )

        # Add optional fields if provided
        optional_fields = [:description, :genre, :logline, :budget, :budget_range, :shooting_location, :release_type]
        optional_fields.each do |field|
          project.send("#{field}=", params[field]) if params[field].present?
        end

        if project.save
          present project, with: V1::Entities::Project
        else
          error!({ error: "Validation failed", details: project.errors.full_messages }, 422)
        end
      end

      desc "Update a project", {
        success: V1::Entities::Project,
        failure: [
          { code: 401, message: "Unauthorized" },
          { code: 404, message: "Project not found" },
          { code: 422, message: "Validation failed" }
        ]
      }
      params do
        requires :id, type: Integer, desc: "Project ID"
        optional :title, type: String, desc: "Project title"
        optional :description, type: String, desc: "Project description"
        optional :project_type, type: String, desc: "Project type (e.g., film, series, short, ad, documentary, or custom)"
        optional :status, type: String, values: %w[draft active locked archived], desc: "Project status"
        optional :budget, type: Float, desc: "Project budget"
      end
      put ":id" do
        authenticate!

        project = Project.find(params[:id])

        if project.update(declared(params, include_missing: false).except(:id))
          present project, with: V1::Entities::Project
        else
          error!({ error: "Validation failed", details: project.errors.full_messages }, 422)
        end
      end

      desc "Delete a project", {
        failure: [
          { code: 401, message: "Unauthorized" },
          { code: 404, message: "Project not found" }
        ]
      }
      params do
        requires :id, type: Integer, desc: "Project ID"
      end
      delete ":id" do
        authenticate!

        project = Project.find(params[:id])
        project.destroy

        { success: true, message: "Project deleted successfully" }
      end
    end
  end
end
