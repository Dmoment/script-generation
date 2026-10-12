# frozen_string_literal: true

module V1
  module Entities
    class SceneComment < Grape::Entity
      expose :id
      expose :scene_id
      expose :parent_id
      expose :element_id
      expose :body
      expose :resolved_at
      expose :created_at
      expose :updated_at
      expose :author do |comment|
        { id: comment.user.id, name: comment.user.name }
      end
      expose :replies, using: V1::Entities::SceneComment, if: ->(comment, _) { comment.parent_id.nil? } do |comment|
        comment.replies.includes(:user).chronological
      end
    end
  end
end
