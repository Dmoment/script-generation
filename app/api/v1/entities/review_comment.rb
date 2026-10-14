# frozen_string_literal: true

module V1
  module Entities
    class ReviewComment < Grape::Entity
      expose :id
      expose :review_link_id
      expose :av_row_id
      expose :scene_id
      expose :author_name
      expose :body
      expose :resolved_at
      expose :created_at
    end
  end
end
