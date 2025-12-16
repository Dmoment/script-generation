# frozen_string_literal: true

module V1
  module Entities
    class Company < Grape::Entity
      expose :id, documentation: { type: "Integer", desc: "Company ID" }
      expose :name, documentation: { type: "String", desc: "Company name" }
      expose :account_type, documentation: { type: "String", desc: "Account type (company or individual)" }
    end

    class User < Grape::Entity
      expose :id, documentation: { type: "String", desc: "User ID" }
      expose :name, documentation: { type: "String", desc: "User's full name" }
      expose :email, documentation: { type: "String", desc: "User's email address" }
      expose :image, documentation: { type: "String", desc: "User's profile image URL" }, if: ->(user, _) { user.image.present? }
      expose :gender, documentation: { type: "String", desc: "User's gender" }, if: ->(user, _) { user.gender.present? }
      expose :phone_number, documentation: { type: "String", desc: "User's phone number" }, if: ->(user, _) { user.phone_number.present? }
      expose :role, documentation: { type: "String", desc: "User's role (admin or member)" }
      expose :onboarding_completed, documentation: { type: "Boolean", desc: "Whether user has completed onboarding" }
      expose :company, using: V1::Entities::Company, documentation: { desc: "User's company" }, if: ->(user, _) { user.company.present? }
      expose :created_at, documentation: { type: "DateTime", desc: "When the user was created" }
      expose :updated_at, documentation: { type: "DateTime", desc: "When the user was last updated" }
    end
  end
end
