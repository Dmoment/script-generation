# frozen_string_literal: true

module V1
  class ScriptsApi < Grape::API
    resource :scripts do
      desc "Get all scripts", {
        success: V1::Entities::Script,
        is_array: true,
        failure: [
          { code: 401, message: "Unauthorized" }
        ]
      }
      params do
        optional :project_id, type: Integer, desc: "Project ID (optional, if not provided returns all accessible scripts)"
        optional :page, type: Integer, default: 1, desc: "Page number"
        optional :per_page, type: Integer, default: 20, desc: "Items per page"
        optional :q, type: Hash, desc: "Ransack search/filter parameters"
      end
      get do
        authenticate!

        scripts = policy_scope(Script)

        if params[:project_id].present?
          project = Project.find(params[:project_id])
          authorize project, :show?
          scripts = scripts.where(project_id: params[:project_id])
        end

        if params[:q].present?
          scripts = scripts.ransack(params[:q]).result
        end

        scripts = scripts.includes(:script_versions)

        paginate_collection(scripts) do |script|
          V1::Entities::Script.represent(script)
        end
      end

      desc "Create a new script", {
        success: V1::Entities::Script,
        failure: [
          { code: 401, message: "Unauthorized" },
          { code: 422, message: "Validation failed" }
        ]
      }
      params do
        requires :project_id, type: Integer, desc: "Project ID"
        requires :title, type: String, desc: "Script title"
        optional :script_type, type: String, values: %w[screenplay treatment outline other], default: "screenplay", desc: "Script type"
        optional :description, type: String, desc: "Script description"
        optional :content, type: String, desc: "Initial script content (for created scripts)"
      end
      post do
        authenticate!

        project = Project.find(params[:project_id])
        authorize project, :show?

        script = Script.new(
          project: project,
          title: params[:title],
          script_type: params[:script_type] || 'screenplay',
          status: 'draft',
          description: params[:description],
          created_by_user_id: current_user.id
        )

        authorize script, :create?

        if script.save
          # Initial version is automatically created via after_create callback
          # If content is provided, we could update the version here
          # For now, the callback handles version creation

          present script.reload, with: V1::Entities::Script
        else
          error!({ error: script.errors.full_messages.join(", ") }, 422)
        end
      end

      desc "Upload a script file", {
        success: V1::Entities::Script,
        failure: [
          { code: 401, message: "Unauthorized" },
          { code: 422, message: "Validation failed" }
        ]
      }
      params do
        requires :project_id, type: Integer, desc: "Project ID"
        requires :title, type: String, desc: "Script title"
        requires :file, type: File, desc: "Script file to upload"
        optional :script_type, type: String, values: %w[screenplay treatment outline other], default: "screenplay", desc: "Script type"
        optional :description, type: String, desc: "Script description"
        optional :notes, type: String, desc: "Version notes"
      end
      post :upload do
        authenticate!

        project = Project.find(params[:project_id])
        authorize project, :show?

        uploaded_file = params[:file]

        error!({ error: "File is required" }, 422) unless uploaded_file
        error!({ error: "File size too large (max 50MB)" }, 422) if uploaded_file.size > 50.megabytes

        script = Script.new(
          project: project,
          title: params[:title],
          script_type: params[:script_type] || 'screenplay',
          status: 'draft',
          description: params[:description],
          created_by_user_id: current_user.id
        )

        authorize script, :create?

        if script.save
          # TODO: Store file using Active Storage or similar
          # For now, we'll just update the initial version notes
          # In production, you'd want to:
          # - Store file in S3 or similar
          # - Extract text content if possible
          # - Store file metadata

          # Update the initial version (created by callback) with upload notes
          initial_version = script.script_versions.find_by(version_number: 1)
          if initial_version
            initial_version.update!(
              notes: params[:notes] || "Uploaded file: #{uploaded_file.filename}"
            )
          end

          present script.reload, with: V1::Entities::Script
        else
          error!({ error: script.errors.full_messages.join(", ") }, 422)
        end
      end

      desc "Get a specific script", {
        success: V1::Entities::Script,
        failure: [
          { code: 401, message: "Unauthorized" },
          { code: 404, message: "Script not found" }
        ]
      }
      params do
        requires :id, type: Integer, desc: "Script ID"
      end
      get ":id" do
        authenticate!
        script = Script.find(params[:id])

        authorize script, :show?
        present script, with: V1::Entities::Script
      end
    end
  end
end
