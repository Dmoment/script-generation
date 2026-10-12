# frozen_string_literal: true

module V1
  class SceneCommentsApi < Grape::API
    helpers do
      def load_scene!
        scene = Scene.find(params[:scene_id])
        authorize scene, :show?
        scene
      end
    end

    resource :scenes do
      route_param :scene_id, type: Integer do
        resource :comments do
          desc "Comment threads on a scene", { success: V1::Entities::SceneComment, is_array: true }
          get do
            authenticate!
            scene = load_scene!
            present scene.comments.roots.includes(:user).chronological, with: V1::Entities::SceneComment
          end

          desc "Add a comment (or a reply with parent_id)", { success: V1::Entities::SceneComment }
          params do
            requires :body, type: String, desc: "Comment text"
            optional :parent_id, type: Integer, desc: "Root comment to reply to"
            optional :element_id, type: String, desc: "Client id of the element the comment is anchored to"
          end
          post do
            authenticate!
            scene = load_scene!
            comment = scene.comments.build(user: current_user, body: params[:body], parent_id: params[:parent_id], element_id: params[:element_id])
            error!({ error: comment.errors.full_messages.join(", ") }, 422) unless comment.save
            present comment.parent || comment, with: V1::Entities::SceneComment
          end

          desc "Resolve or reopen a thread"
          params do
            requires :id, type: Integer
            requires :resolved, type: Boolean
          end
          put ":id/resolve" do
            authenticate!
            scene = load_scene!
            comment = scene.comments.roots.find(params[:id])
            comment.update!(resolved_at: params[:resolved] ? Time.current : nil)
            present comment, with: V1::Entities::SceneComment
          end

          desc "Delete your own comment"
          params { requires :id, type: Integer }
          delete ":id" do
            authenticate!
            scene = load_scene!
            comment = scene.comments.find(params[:id])
            error!({ error: "Only the author can delete a comment" }, 403) unless comment.user_id == current_user.id || current_user.super_admin?
            comment.destroy!
            status 204
          end
        end
      end
    end
  end
end
