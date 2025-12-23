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

        scripts = scripts.includes(script_versions: :file_attachment)

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

        temp_script = Script.new(project: project, created_by_user_id: current_user.id)
        authorize temp_script, :create?

        service = ScriptCreationService.new(
          project: project,
          user: current_user,
          params: {
            title: params[:title],
            script_type: params[:script_type],
            description: params[:description]
          }
        )

        script = service.call

        initial_version = script.script_versions.find_by(version_number: 1)
        if initial_version && initial_version.scenes.empty?
          initial_version.scenes.create!(
            scene_number: 1,
            slugline: "INT. LOCATION - DAY",
            content: "",
            order: 1
          )
        end

        present script.reload, with: V1::Entities::Script
      rescue ActiveRecord::RecordInvalid => e
        error!({ error: e.record.errors.full_messages.join(", ") }, 422)
      rescue StandardError => e
        error!({ error: "Failed to create script: #{e.message}" }, 500)
      end

      desc "Upload a script file", {
        success: V1::Entities::Script,
        failure: [
          { code: 401, message: "Unauthorized" },
          { code: 422, message: "Validation failed" }
        ]
      }
      # Skip params block - Grape's format :json interferes with multipart parsing
      # Parse manually using MultipartParams concern
      post :upload do
        authenticate!

        form_params = parse_multipart_params(env)

        result = extract_multipart_params(
          form_params,
          required_fields: ['project_id', 'title', 'file']
        )

        if result[:errors].any?
          error!({ error: result[:errors].join(", ") }, 400)
        end

        project_id = result[:params][:project_id]&.to_i
        project = Project.find(project_id)
        authorize project, :show?

        temp_script = Script.new(project: project, created_by_user_id: current_user.id)
        authorize temp_script, :create?

        service = ScriptUploadService.new(
          project: project,
          user: current_user,
          params: {
            project_id: project_id,
            title: result[:params][:title],
            script_type: result[:params][:script_type] || 'screenplay',
            description: result[:params][:description],
            notes: result[:params][:notes],
            file: result[:file] # ActionDispatch::Http::UploadedFile directly
          }
        )

        script = service.call

        initial_version = script.script_versions.find_by(version_number: 1)
        if initial_version && initial_version.scenes.empty?
          Rails.logger.warn "Script #{script.id} uploaded but no initial scene found. Creating now..."
          initial_version.scenes.create!(
            scene_number: 1,
            slugline: "INT. LOCATION - DAY",
            content: "",
            order: 1
          )
        end

        present script.reload, with: V1::Entities::Script
      rescue ScriptUploadError::Base => e
        error_message = e.respond_to?(:errors) && e.errors.any? ? e.errors.join(", ") : e.message
        error!({ error: error_message }, e.status_code)
      rescue StandardError => e
        error!({ error: "Upload failed: #{e.message}" }, 500)
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

      desc "Delete a script", {
        success: { message: String },
        failure: [
          { code: 401, message: "Unauthorized" },
          { code: 404, message: "Script not found" }
        ]
      }
      params do
        requires :id, type: Integer, desc: "Script ID"
      end
      delete ":id" do
        authenticate!
        script = Script.find(params[:id])

        authorize script, :destroy?

        if script.destroy
          { message: "Script deleted successfully" }
        else
          error!({ error: script.errors.full_messages.join(", ") }, 422)
        end
      end
    end

    resource :script_versions do
      desc "Delete a script version", {
        success: { message: String },
        failure: [
          { code: 401, message: "Unauthorized" },
          { code: 404, message: "Script version not found" }
        ]
      }
      params do
        requires :id, type: Integer, desc: "Script Version ID"
      end
      delete ":id" do
        authenticate!
        script_version = ScriptVersion.find(params[:id])
        script = script_version.script

        authorize script, :show?

        # If deleting version 1, delete the entire script (which will cascade delete all versions)
        if script_version.version_number == 1
          authorize script, :destroy?
          if script.destroy
            { message: "Script deleted successfully (version 1 was the only version)" }
          else
            error!({ error: script.errors.full_messages.join(", ") }, 422)
          end
        else
          # Delete only this version
          if script_version.destroy
            { message: "Script version deleted successfully" }
          else
            error!({ error: script_version.errors.full_messages.join(", ") }, 422)
          end
        end
      end
    end
  end
end
