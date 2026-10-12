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
        optional :content, type: String, desc: "Scene content/text (legacy, prefer elements)"
        optional :elements, type: Array, desc: "Structured screenplay elements array" do
          optional :type, type: String, values: Screenplay::ElementTypes::TYPES,
                   desc: "Element type: slugline, action, character, dialogue, parenthetical, transition, centered"
          optional :text, type: String, desc: "Element text content"
          optional :extensions, type: Array[String], desc: "Character extensions (V.O., O.S., CONT'D)"
          optional :id, type: String, desc: "Optional client-side element ID"
        end
        optional :order, type: Integer, desc: "Display order (defaults to next available)"
        optional :metadata, type: Hash, desc: "Additional metadata (JSON object)"
        optional :after_scene_id, type: Integer, desc: "Insert directly after this scene (renumbers, or assigns an A-scene label when numbers are locked)"
      end
      post do
        authenticate!

        script_version = ScriptVersion.find(params[:script_version_id])
        authorize script_version.script, :update?

        metadata = params[:metadata] || {}
        scene_number = params[:scene_number]
        order = params[:order]

        if params[:after_scene_id]
          previous = script_version.scenes.find(params[:after_scene_id])
          following = script_version.scenes.where("\"order\" > ?", previous.order).order(:order)
          if script_version.numbers_locked?
            metadata = metadata.merge("scene_label" => Screenplay::SceneNumbering.inserted_label(script_version, previous))
            scene_number = (script_version.scenes.maximum(:scene_number) || 0) + 1
          else
            # Open numbering: shift everything after the insertion point by one (two passes for the unique index).
            following.reverse_each { |s| s.update_columns(scene_number: -(s.scene_number + 1)) }
            following.reverse_each { |s| s.update_columns(scene_number: -s.scene_number, order: s.order + 1) }
            scene_number = previous.scene_number + 1
          end
          order = previous.order + 1
          following.each { |s| s.update_columns(order: s.order + 1) } if script_version.numbers_locked?
        end

        scene = Scene.new(
          script_version: script_version,
          scene_number: scene_number,
          slugline: params[:slugline],
          content: params[:content],
          elements: params[:elements] || [],
          order: order,
          metadata: metadata
        )

        # If content provided but no elements, parse content into elements
        if params[:content].present? && params[:elements].blank?
          scene.parse_content_to_elements!
        end

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
        optional :content, type: String, desc: "Scene content/text (legacy, prefer elements)"
        optional :elements, type: Array, desc: "Structured screenplay elements array" do
          optional :type, type: String, values: Screenplay::ElementTypes::TYPES,
                   desc: "Element type: slugline, action, character, dialogue, parenthetical, transition, centered"
          optional :text, type: String, desc: "Element text content"
          optional :extensions, type: Array[String], desc: "Character extensions (V.O., O.S., CONT'D)"
          optional :id, type: String, desc: "Optional client-side element ID"
        end
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
        update_attributes[:elements] = params[:elements] if params.key?(:elements)
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

        if scene.script_version.numbers_locked? && !scene.omitted?
          # Locked numbering: keep the number as an OMITTED placeholder.
          Screenplay::SceneNumbering.omit!(scene)
          present scene, with: V1::Entities::Scene
        else
          scene.destroy
          status 204
        end
      end
    end
  end
end
