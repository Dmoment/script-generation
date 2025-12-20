# frozen_string_literal: true

module V1
  module Entities
    class ScriptVersion < Grape::Entity
      expose :id
      expose :script_id
      expose :version_number
      expose :notes
      expose :created_at
      expose :updated_at

      expose :has_uploaded_file do |version|
        version.file.attached?
      end
    end
  end
end
