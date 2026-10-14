# frozen_string_literal: true

module V1
  module Entities
    class ReviewLink < Grape::Entity
      expose :id
      expose :script_version_id
      expose :token
      expose :client_name
      expose :status
      expose :expires_at
      expose :revoked_at
      expose :decided_at
      expose :decided_by_name
      expose :decision_note
      expose :created_at
      expose :url do |link, options|
        "#{options[:origin]}/review/#{link.token}"
      end
      expose :comment_count do |link|
        link.review_comments.size
      end
      expose :open_comment_count do |link|
        link.review_comments.count(&:resolved_at).then { |resolved| link.review_comments.size - resolved }
      end
    end
  end
end
