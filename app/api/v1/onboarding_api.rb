# frozen_string_literal: true

module V1
  class OnboardingApi < Grape::API
    resource :onboarding do
      desc "Complete user onboarding", {
        success: V1::Entities::User,
        failure: [
          { code: 401, message: "Unauthorized" },
          { code: 422, message: "Validation failed" }
        ]
      }
      params do
        requires :account_type, type: String, values: %w[company individual], desc: "Account type"
        requires :full_name, type: String, desc: "User's full name"
        requires :gender, type: String, values: %w[male female other], desc: "User's gender"
        optional :company_name, type: String, desc: "Company name (required if account_type is company)"
      end
      post :complete do
        authenticate!

        # Validate company_name is present for company accounts
        if params[:account_type] == "company" && params[:company_name].blank?
          error!({ error: "Company name is required for company accounts" }, 422)
        end

        ActiveRecord::Base.transaction do
          # Create or find company
          company_name = if params[:account_type] == "company"
                           params[:company_name]
                         else
                           # For individual accounts, create a company with user's name
                           "#{params[:full_name]}'s Workspace"
                         end

          company = Company.create!(
            name: company_name,
            account_type: params[:account_type]
          )

          # Update user with onboarding info
          current_user.update!(
            name: params[:full_name],
            gender: params[:gender],
            company_id: company.id,
            role: nil, # Role is now company-specific, stored in access_controls
            onboarding_completed: true
          )

          # Create access_control record - first user is always company_admin
          AccessControl.find_or_create_by!(
            user_id: current_user.id,
            company_id: company.id,
            project_id: nil # Company-level role
          ) do |ac|
            ac.role = 'company_admin'
          end

          present current_user.reload, with: V1::Entities::User
        end
      rescue ActiveRecord::RecordInvalid => e
        error!({ error: "Validation failed", details: e.record.errors.full_messages }, 422)
      end

      desc "Get onboarding status", {
        success: { code: 200, model: V1::Entities::User },
        failure: [
          { code: 401, message: "Unauthorized" }
        ]
      }
      get :status do
        authenticate!
        present current_user, with: V1::Entities::User
      end
    end
  end
end
