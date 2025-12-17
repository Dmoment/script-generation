# frozen_string_literal: true

module V1
  module Entities
    class Project < Grape::Entity
      expose :id, documentation: { type: "Integer", desc: "Project ID" }
      expose :title, documentation: { type: "String", desc: "Project title" }
      expose :description, documentation: { type: "String", desc: "Project description" }, if: ->(project, _) { project.description.present? }
      expose :project_type, documentation: {
        type: "String",
        desc: "Project type (e.g., film, series, short, ad, documentary, or custom)"
      }
      expose :status, documentation: {
        type: "String",
        desc: "Project status",
        values: %w[draft active locked archived]
      }
      expose :budget, documentation: { type: "Float", desc: "Project budget" }, if: ->(project, _) { project.budget.present? }
      expose :created_at, documentation: { type: "DateTime", desc: "When the project was created" }
      expose :updated_at, documentation: { type: "DateTime", desc: "When the project was last updated" }
    end
  end
end
