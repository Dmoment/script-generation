# frozen_string_literal: true

module V1
  module Entities
    class Project < Grape::Entity
      expose :id, documentation: { type: "Integer", desc: "Project ID" }
      expose :name, documentation: { type: "String", desc: "Project name" }
      expose :description, documentation: { type: "String", desc: "Project description" }
      expose :status, documentation: {
        type: "String",
        desc: "Project status",
        values: [ "active", "completed", "draft" ]
      }
      expose :budget, documentation: { type: "Float", desc: "Project budget" }
      expose :created_at, documentation: { type: "DateTime", desc: "When the project was created" }
      expose :updated_at, documentation: { type: "DateTime", desc: "When the project was last updated" }
    end
  end
end
