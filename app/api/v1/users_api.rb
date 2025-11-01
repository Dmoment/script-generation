# frozen_string_literal: true

module V1
  class UsersApi < Grape::API
    resource :users do
      desc "Get current user", {
        success: V1::Entities::User,
        failure: [
          { code: 401, message: "Unauthorized" }
        ]
      }
      get :current do
        authenticate!
        present current_user, with: V1::Entities::User
      end

      desc "Get all users", {
        success: V1::Entities::User,
        is_array: true,
        failure: [
          { code: 401, message: "Unauthorized" }
        ]
      }
      params do
        optional :page, type: Integer, default: 1, desc: "Page number"
        optional :per_page, type: Integer, default: 20, desc: "Items per page"
      end
      get do
        # authenticate! # Commented out for testing
        users = User.limit(params[:per_page]).offset((params[:page] - 1) * params[:per_page])
        present users, with: V1::Entities::User
      end

      desc "Get a specific user", {
        success: V1::Entities::User,
        failure: [
          { code: 401, message: "Unauthorized" },
          { code: 404, message: "User not found" }
        ]
      }
      params do
        requires :id, type: String, desc: "User ID"
      end
      get ":id" do
        authenticate!
        user = User.find(params[:id])
        present user, with: V1::Entities::User
      end

      desc "Update current user", {
        success: V1::Entities::User,
        failure: [
          { code: 401, message: "Unauthorized" },
          { code: 422, message: "Validation failed" }
        ]
      }
      params do
        optional :name, type: String, desc: "User's full name"
        optional :email, type: String, desc: "User's email address"
        optional :image, type: String, desc: "User's profile image URL"
      end
      put :current do
        authenticate!

        if current_user.update(declared(params, include_missing: false))
          present current_user, with: V1::Entities::User
        else
          error!({ error: "Validation failed", details: current_user.errors.full_messages }, 422)
        end
      end
    end
  end
end
