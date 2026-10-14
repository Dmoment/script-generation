# frozen_string_literal: true

module V1
  # The writer's side of client review: create, list and revoke links, and
  # resolve the comments that came back through them.
  class ReviewLinksApi < Grape::API
    helpers do
      def request_origin
        env["HTTP_ORIGIN"].presence || "#{request.scheme}://#{request.host_with_port}"
      end
    end

    resource :script_versions do
      route_param :id, type: Integer do
        desc "Review links for this round", { success: V1::Entities::ReviewLink, is_array: true }
        get :review_links do
          authenticate!
          version = ScriptVersion.find(params[:id])
          authorize version.script, :show?
          present version.review_links.includes(:review_comments).recent, with: V1::Entities::ReviewLink, origin: request_origin
        end

        desc "Create a review link for this round", { success: V1::Entities::ReviewLink }
        params do
          optional :client_name, type: String, desc: "Who the link is for (shown on the review page)"
          optional :expires_in_days, type: Integer, values: 1..90, default: 14
        end
        post :review_links do
          authenticate!
          version = ScriptVersion.find(params[:id])
          authorize version.script, :update?
          link = version.review_links.create!(
            created_by_user: current_user,
            client_name: params[:client_name].presence,
            expires_at: params[:expires_in_days].days.from_now
          )
          present link, with: V1::Entities::ReviewLink, origin: request_origin
        end

        desc "Every comment that came back through this round's review links", { success: V1::Entities::ReviewComment, is_array: true }
        get :review_comments do
          authenticate!
          version = ScriptVersion.find(params[:id])
          authorize version.script, :show?
          comments = ReviewComment.where(review_link_id: version.review_links.select(:id)).chronological
          present comments, with: V1::Entities::ReviewComment
        end
      end
    end

    resource :review_links do
      route_param :id, type: Integer do
        desc "Revoke a review link (the page stops working immediately)", { success: V1::Entities::ReviewLink }
        delete do
          authenticate!
          link = ReviewLink.find(params[:id])
          authorize link.script, :update?
          link.update!(revoked_at: Time.current)
          present link, with: V1::Entities::ReviewLink, origin: request_origin
        end
      end
    end

    resource :review_comments do
      route_param :id, type: Integer do
        desc "Resolve or reopen a reviewer's comment", { success: V1::Entities::ReviewComment }
        params { requires :resolved, type: Boolean }
        put :resolve do
          authenticate!
          comment = ReviewComment.find(params[:id])
          authorize comment.review_link.script, :update?
          comment.update!(resolved_at: params[:resolved] ? Time.current : nil)
          present comment, with: V1::Entities::ReviewComment
        end
      end
    end
  end
end
