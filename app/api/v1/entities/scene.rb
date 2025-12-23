# frozen_string_literal: true

module V1
  module Entities
    class Scene < Grape::Entity
      expose :id
      expose :script_version_id
      expose :scene_number
      expose :slugline
      expose :content
      expose :order
      expose :metadata
      expose :created_at
      expose :updated_at
    end
  end
end

