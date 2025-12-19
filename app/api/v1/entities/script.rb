# frozen_string_literal: true

module V1
  module Entities
    class Script < Grape::Entity
      # Core identification fields (used in frontend)
      expose :id
      expose :project_id
      expose :title

      # Script metadata (used in frontend)
      expose :script_type
      expose :status
      expose :description

      # Version information (used for display in frontend)
      expose :version_count do |script|
        script.script_versions.count
      end
      expose :latest_version_number do |script|
        script.script_versions.maximum(:version_number) || 0
      end

      # Timestamps (used for sorting/display in frontend)
      expose :created_at
      expose :updated_at

      # Versions (used for display in frontend)
      expose :script_versions, using: V1::Entities::ScriptVersion, if: ->(script, _options) { script.script_versions.loaded? || script.script_versions.any? }
    end
  end
end
