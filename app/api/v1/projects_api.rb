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
        optional :status, type: String, values: ["active", "completed", "draft"], desc: "Filter by status"
      end
      get do
        authenticate! # Commented out for testing

        projects = Project.all
        projects = projects.where(status: params[:status]) if params[:status].present?
        projects = projects.limit(params[:per_page]).offset((params[:page] - 1) * params[:per_page])

        present projects, with: V1::Entities::Project
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
        requires :name, type: String, desc: "Project name"
        optional :description, type: String, desc: "Project description"
        optional :status, type: String, values: ["active", "completed", "draft"], default: "draft", desc: "Project status"
        optional :budget, type: Float, desc: "Project budget"
      end
      post do
        authenticate!

        project = Project.new(declared(params, include_missing: false))

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
        optional :name, type: String, desc: "Project name"
        optional :description, type: String, desc: "Project description"
        optional :status, type: String, values: ["active", "completed", "draft"], desc: "Project status"
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
