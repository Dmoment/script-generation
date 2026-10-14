# frozen_string_literal: true

module V1
  module Entities
    class AvRow < Grape::Entity
      expose :id
      expose :script_version_id
      expose :position
      expose :shot
      expose :video
      expose :audio
      expose :super_text
      expose :duration_seconds
      expose :notes
      expose :metadata
      expose :created_at
      expose :updated_at
    end
  end
end
