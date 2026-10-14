# frozen_string_literal: true

module V1
  # The client's side of review. No login: the token in the URL is the
  # credential. Revoked or expired links answer 410 so a stale link is never
  # mistaken for a broken page.
  class ReviewApi < Grape::API
    helpers do
      def load_link!
        link = ReviewLink.includes(script_version: :script).find_by(token: params[:token])
        error!({ error: "This review link does not exist" }, 404) unless link
        error!({ error: "This review link has expired or been withdrawn" }, 410) unless link.usable?
        link
      end

      def payload(link)
        version = link.script_version
        script = version.script
        {
          token: link.token,
          client_name: link.client_name,
          status: link.status,
          decided_at: link.decided_at,
          decided_by_name: link.decided_by_name,
          decision_note: link.decision_note,
          expires_at: link.expires_at,
          script: { title: script.title, kind: script.av? ? "av" : "screenplay", project_title: script.project&.title, author_name: script.created_by_user&.name },
          round: { id: version.id, number: version.version_number, notes: version.notes, updated_at: version.updated_at },
          rows: script.av? ? V1::Entities::AvRow.represent(version.av_rows.ordered).as_json : [],
          scenes: script.av? ? [] : V1::Entities::Scene.represent(version.scenes.ordered).as_json,
          total_seconds: script.av? ? version.av_rows.sum(:duration_seconds) : nil,
          comments: V1::Entities::ReviewComment.represent(link.review_comments.chronological).as_json
        }
      end
    end

    resource :review do
      route_param :token, type: String do
        desc "Read-only view of the round behind a review link (no login)"
        get do
          payload(load_link!)
        end

        desc "Leave a comment on a row, a scene, or the whole round"
        params do
          requires :author_name, type: String
          requires :body, type: String
          optional :av_row_id, type: Integer
          optional :scene_id, type: Integer
        end
        post :comments do
          link = load_link!
          comment = link.review_comments.build(
            author_name: params[:author_name].strip, body: params[:body].strip,
            av_row_id: params[:av_row_id], scene_id: params[:scene_id]
          )
          error!({ error: comment.errors.full_messages.join(", ") }, 422) unless comment.save
          present comment, with: V1::Entities::ReviewComment
        end

        desc "Approve this round, or ask for changes"
        params do
          requires :decision, type: String, values: %w[approved changes_requested]
          requires :name, type: String
          optional :note, type: String
        end
        post :decision do
          link = load_link!
          link.decide!(params[:decision], name: params[:name].strip, note: params[:note].presence&.strip)
          payload(link)
        end
      end
    end
  end
end
