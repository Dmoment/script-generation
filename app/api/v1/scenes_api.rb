# frozen_string_literal: true

module V1
  class ScenesApi < Grape::API
    resource :scenes do
      desc "Get all scenes for a script version", {
        success: V1::Entities::Scene,
        is_array: true,
        failure: [
          { code: 401, message: "Unauthorized" },
          { code: 404, message: "Script version not found" }
        ]
      }
      params do
        requires :script_version_id, type: Integer, desc: "Script version ID"
        optional :page, type: Integer, default: 1, desc: "Page number"
        optional :per_page, type: Integer, default: 100, desc: "Items per page"
      end
      get do
        authenticate!

        script_version = ScriptVersion.find(params[:script_version_id])
        authorize script_version.script, :show?

        scenes = policy_scope(Scene).where(script_version_id: params[:script_version_id])
        scenes = scenes.order(:order, :scene_number)

        result = paginate_collection(scenes) do |scene|
          V1::Entities::Scene.represent(scene)
        end

        result
      end

      desc "Get a specific scene", {
        success: V1::Entities::Scene,
        failure: [
          { code: 401, message: "Unauthorized" },
          { code: 404, message: "Scene not found" }
        ]
      }
      params do
        requires :id, type: Integer, desc: "Scene ID"
      end
      get ":id" do
        authenticate!

        scene = Scene.find(params[:id])
        authorize scene, :show?

        present scene, with: V1::Entities::Scene
      end

      desc "Create a new scene", {
        success: V1::Entities::Scene,
        failure: [
          { code: 401, message: "Unauthorized" },
          { code: 404, message: "Script version not found" },
          { code: 422, message: "Validation failed" }
        ]
      }
      params do
        requires :script_version_id, type: Integer, desc: "Script version ID"
        requires :scene_number, type: Integer, desc: "Scene number"
        optional :slugline, type: String, desc: "Scene slugline (e.g., 'EXT. BEACH - DAY')"
        optional :content, type: String, desc: "Scene content/text"
        optional :order, type: Integer, desc: "Display order (defaults to next available)"
        optional :metadata, type: Hash, desc: "Additional metadata (JSON object)"
      end
      post do
        authenticate!

        script_version = ScriptVersion.find(params[:script_version_id])
        authorize script_version.script, :update?

        scene = Scene.new(
          script_version: script_version,
          scene_number: params[:scene_number],
          slugline: params[:slugline],
          content: params[:content],
          order: params[:order],
          metadata: params[:metadata] || {}
        )

        authorize scene, :create?

        if scene.save
          present scene, with: V1::Entities::Scene
        else
          error!({ error: "Validation failed", details: scene.errors.full_messages }, 422)
        end
      end

      desc "Update a scene", {
        success: V1::Entities::Scene,
        failure: [
          { code: 401, message: "Unauthorized" },
          { code: 404, message: "Scene not found" },
          { code: 422, message: "Validation failed" }
        ]
      }
      params do
        requires :id, type: Integer, desc: "Scene ID"
        optional :scene_number, type: Integer, desc: "Scene number"
        optional :slugline, type: String, desc: "Scene slugline"
        optional :content, type: String, desc: "Scene content/text"
        optional :order, type: Integer, desc: "Display order"
        optional :metadata, type: Hash, desc: "Additional metadata (JSON object)"
      end
      put ":id" do
        authenticate!

        scene = Scene.find(params[:id])
        authorize scene, :update?

        update_attributes = {}
        update_attributes[:scene_number] = params[:scene_number] if params.key?(:scene_number)
        update_attributes[:slugline] = params[:slugline] if params.key?(:slugline)
        update_attributes[:content] = params[:content] if params.key?(:content)
        update_attributes[:order] = params[:order] if params.key?(:order)
        update_attributes[:metadata] = params[:metadata] if params.key?(:metadata)

        scene.assign_attributes(update_attributes)

        if scene.save
          present scene, with: V1::Entities::Scene
        else
          error!({ error: "Validation failed", details: scene.errors.full_messages }, 422)
        end
      end

      desc "Delete a scene", {
        success: { code: 204, message: "Scene deleted successfully" },
        failure: [
          { code: 401, message: "Unauthorized" },
          { code: 404, message: "Scene not found" }
        ]
      }
      params do
        requires :id, type: Integer, desc: "Scene ID"
      end
      delete ":id" do
        authenticate!

        scene = Scene.find(params[:id])
        authorize scene, :destroy?

        scene.destroy
        status 204
      end
    end
  end
end
