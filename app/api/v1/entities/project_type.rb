# frozen_string_literal: true

module V1
  module Entities
    class ProjectType < Grape::Entity
      expose :id, documentation: { type: "Integer", desc: "Project type ID" }
      expose :name, documentation: { type: "String", desc: "Project type name" }
    end
  end
end
