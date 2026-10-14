# frozen_string_literal: true

module V1
  module Entities
    class ScriptVersion < Grape::Entity
      expose :id
      expose :script_id
      expose :version_number
      expose :notes
      expose :scene_numbers_locked_at
      expose :revision_color
      expose :revision_date
      expose :revision_color_label do |version|
        version.revision_color.present? ? Screenplay::RevisionColors.label(version.revision_color) : nil
      end
      expose :created_at
      expose :updated_at

      expose :review, documentation: { type: "Hash", desc: "Client review state of this round" } do |version|
        version.review_summary
      end

      expose :has_uploaded_file do |version|
        version.file.attached?
      end
    end
  end
end
