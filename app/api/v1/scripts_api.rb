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
          required_fields: [ "project_id", "title", "file" ]
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
            script_type: result[:params][:script_type] || "screenplay",
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

      desc "Create the next draft of a script by copying the latest (or a given) version", {
        success: V1::Entities::ScriptVersion,
        failure: [
          { code: 401, message: "Unauthorized" },
          { code: 404, message: "Script not found" }
        ]
      }
      params do
        requires :id, type: Integer, desc: "Script ID"
        optional :source_version_id, type: Integer, desc: "Version to copy (defaults to the latest)"
        optional :notes, type: String, desc: "Draft notes"
      end
      post ":id/versions" do
        authenticate!
        script = Script.find(params[:id])
        authorize script, :update?

        source = params[:source_version_id] ? script.script_versions.find(params[:source_version_id]) : nil
        version = Screenplay::VersionCloner.new(script, source_version: source, notes: params[:notes]).call
        present version, with: V1::Entities::ScriptVersion
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
      desc "Preview post-formatting changes for a script version", {
        success: { message: String },
        failure: [
          { code: 401, message: "Unauthorized" },
          { code: 404, message: "Script version not found" }
        ]
      }
      params do
        requires :id, type: Integer, desc: "Script Version ID"
      end
      get ":id/format_preview" do
        authenticate!
        script_version = ScriptVersion.includes(:scenes).find(params[:id])
        authorize script_version.script, :show?

        formatter = Screenplay::PostFormatter.new
        result = formatter.format_script_version(script_version)

        {
          total_changes: result[:total_changes],
          changes: result[:changes],
          formatted_scenes: result[:formatted_scenes].map do |scene|
            {
              id: scene[:id],
              scene_number: scene[:scene_number],
              slugline: scene[:slugline],
              original_slugline: scene[:original_slugline],
              elements: scene[:elements],
              original_elements: scene[:original_elements]
            }
          end
        }
      end

      desc "Apply post-formatting to a script version", {
        success: { message: String },
        failure: [
          { code: 401, message: "Unauthorized" },
          { code: 404, message: "Script version not found" }
        ]
      }
      params do
        requires :id, type: Integer, desc: "Script Version ID"
      end
      post ":id/apply_formatting" do
        authenticate!
        script_version = ScriptVersion.includes(:scenes).find(params[:id])
        authorize script_version.script, :update?

        formatter = Screenplay::PostFormatter.new
        result = formatter.format_script_version(script_version)

        # Apply the formatting
        formatter.apply_formatting!(script_version, result)

        {
          message: "Formatting applied successfully",
          total_changes: result[:total_changes],
          scenes_updated: result[:formatted_scenes].length
        }
      end

      desc "Export a script version as a Final Draft (.fdx) or Fountain file", {
        failure: [
          { code: 401, message: "Unauthorized" },
          { code: 404, message: "Script version not found" }
        ]
      }
      params do
        requires :id, type: Integer, desc: "Script Version ID"
        # Named file_format because Grape reserves `format` for response negotiation.
        requires :file_format, type: String, values: Screenplay::Exporter::FORMATS.keys, desc: "fdx or fountain"
      end
      get ":id/export" do
        authenticate!
        script_version = ScriptVersion.includes(:scenes, :script).find(params[:id])
        authorize script_version.script, :show?

        exporter_class = Screenplay::Exporter.for(params[:file_format])
        filename = Screenplay::Exporter.filename(script_version, params[:file_format])

        env["api.format"] = :binary
        header "Content-Type", exporter_class::MIME_TYPE
        header "Content-Disposition", "attachment; filename=\"#{filename}\""
        body exporter_class.new(script_version).export
      end

      desc "Import a screenplay file (.fdx, .fountain, .txt), replacing this version's scenes", {
        failure: [
          { code: 400, message: "Bad request" },
          { code: 401, message: "Unauthorized" },
          { code: 404, message: "Script version not found" },
          { code: 422, message: "File could not be parsed" }
        ]
      }
      # Multipart: parsed manually via MultipartParams (see scripts upload)
      post ":id/import" do
        authenticate!
        script_version = ScriptVersion.find(params[:id])
        authorize script_version.script, :update?

        form_params = parse_multipart_params(env)
        result = extract_multipart_params(form_params, required_fields: [ "file" ])
        error!({ error: result[:errors].join(", ") }, 400) if result[:errors].any?

        import = Screenplay::ScriptImporter.new(script_version, file: result[:file]).call
        {
          message: "Imported #{import.scenes_count} scenes",
          format: import.format,
          scenes_count: import.scenes_count,
          elements_count: import.elements_count
        }
      rescue Screenplay::ImportError => e
        error!({ error: e.message }, 422)
      end

      desc "Reorder scenes: scene numbers and display order follow the given id sequence", {
        success: V1::Entities::Scene,
        is_array: true,
        failure: [
          { code: 401, message: "Unauthorized" },
          { code: 404, message: "Script version not found" },
          { code: 422, message: "Scene ids do not match this version" }
        ]
      }
      params do
        requires :id, type: Integer, desc: "Script Version ID"
        requires :scene_ids, type: Array[Integer], desc: "Every scene id of this version, in the new order"
      end
      put ":id/reorder_scenes" do
        authenticate!
        script_version = ScriptVersion.find(params[:id])
        authorize script_version.script, :update?

        scenes = script_version.scenes.index_by(&:id)
        ids = params[:scene_ids]
        unless ids.sort == scenes.keys.sort
          error!({ error: "scene_ids must contain every scene of this version exactly once" }, 422)
        end

        ActiveRecord::Base.transaction do
          # Two passes keep the unique (version, scene_number) index happy while numbers shuffle.
          ids.each_with_index { |scene_id, i| scenes[scene_id].update_columns(scene_number: -(i + 1)) }
          ids.each_with_index do |scene_id, i|
            scenes[scene_id].update_columns(scene_number: i + 1, order: i + 1, updated_at: Time.current)
          end
        end

        present script_version.scenes.ordered.reload, with: V1::Entities::Scene
      end

      desc "Compare this version with another version of the same script (scene by scene, element by element)", {
        failure: [
          { code: 401, message: "Unauthorized" },
          { code: 404, message: "Version not found" },
          { code: 422, message: "Versions belong to different scripts" }
        ]
      }
      params do
        requires :id, type: Integer, desc: "Target (newer) version ID"
        requires :with, type: Integer, desc: "Base (older) version ID"
      end
      get ":id/compare" do
        authenticate!
        target = ScriptVersion.includes(:scenes).find(params[:id])
        base = ScriptVersion.includes(:scenes).find(params[:with])
        authorize target.script, :show?
        error!({ error: "Versions belong to different scripts" }, 422) unless base.script_id == target.script_id

        results = Screenplay::VersionDiff.new(base, target).call
        {
          base: { id: base.id, version_number: base.version_number, notes: base.notes },
          target: { id: target.id, version_number: target.version_number, notes: target.notes },
          summary: results.group_by(&:status).transform_values(&:size),
          scenes: results.map(&:to_h)
        }
      end

      desc "Scenes revised since the previous draft (revision marks)", {
        failure: [ { code: 401, message: "Unauthorized" }, { code: 404, message: "Version not found" } ]
      }
      params do
        requires :id, type: Integer, desc: "Version ID"
      end
      get ":id/revisions" do
        authenticate!
        version = ScriptVersion.includes(:scenes).find(params[:id])
        authorize version.script, :show?

        previous = version.script.script_versions.where("version_number < ?", version.version_number).order(version_number: :desc).first
        if previous
          diff = Screenplay::VersionDiff.new(previous, version)
          { previous_version: { id: previous.id, version_number: previous.version_number }, changed_scene_ids: diff.changed_scene_ids }
        else
          { previous_version: nil, changed_scene_ids: [] }
        end
      end

      desc "Production breakdown for a version (JSON, or CSV with file_format=csv)", {
        failure: [ { code: 401, message: "Unauthorized" }, { code: 404, message: "Version not found" } ]
      }
      params do
        requires :id, type: Integer, desc: "Version ID"
        optional :file_format, type: String, values: %w[json csv], default: "json"
      end
      get ":id/breakdown" do
        authenticate!
        version = ScriptVersion.includes(:scenes).find(params[:id])
        authorize version.script, :show?

        breakdown = Screenplay::Breakdown.new(version)
        if params[:file_format] == "csv"
          env["api.format"] = :binary
          header "Content-Type", "text/csv; charset=utf-8"
          header "Content-Disposition", "attachment; filename=\"#{version.script.title.parameterize.presence || 'script'}-v#{version.version_number}-breakdown.csv\""
          body breakdown.to_csv
        else
          breakdown.call
        end
      end

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
