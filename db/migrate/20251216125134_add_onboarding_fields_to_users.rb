class AddOnboardingFieldsToUsers < ActiveRecord::Migration[8.0]
  def change
    add_reference :users, :company, null: true, foreign_key: true
    add_column :users, :onboarding_completed, :boolean, default: false, null: false
    add_column :users, :role, :string, default: 'member'
  end
end
