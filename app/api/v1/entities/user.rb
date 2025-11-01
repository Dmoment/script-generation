# frozen_string_literal: true

module V1
  module Entities
    class User < Grape::Entity
      expose :id, documentation: { type: "String", desc: "User ID" }
      expose :name, documentation: { type: "String", desc: "User's full name" }
      expose :email, documentation: { type: "String", desc: "User's email address" }
      expose :image, documentation: { type: "String", desc: "User's profile image URL" }, if: ->(user, _) { user.image.present? }
      expose :created_at, documentation: { type: "DateTime", desc: "When the user was created" }
      expose :updated_at, documentation: { type: "DateTime", desc: "When the user was last updated" }
    end
  end
end
