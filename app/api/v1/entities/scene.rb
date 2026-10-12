# frozen_string_literal: true

module V1
  module Entities
    class Scene < Grape::Entity
      expose :id
      expose :script_version_id
      expose :scene_number
      expose :slugline
      expose :content
      expose :elements
      expose :order
      expose :metadata
      expose :created_at
      expose :updated_at

      # Expose derived data for convenience
      expose :character_names, documentation: { type: "Array", desc: "List of character names in this scene" }
      expose :locations, documentation: { type: "Array", desc: "List of locations in this scene" }
    end
  end
end
