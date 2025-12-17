class AddProjectFields < ActiveRecord::Migration[8.0]
  def change
    # Core associations
    add_reference :projects, :company, null: false, foreign_key: true
    add_reference :projects, :created_by_user, null: false, foreign_key: { to_table: :users }, type: :uuid

    # Rename name to title for clarity
    rename_column :projects, :name, :title

    # Project type
    add_column :projects, :project_type, :string, null: false, default: 'film'

    # Update status enum to include locked and archived
    # Note: We'll handle this in the model validation

    # Add indexes for common queries
    # Note: company_id and created_by_user_id indexes are created by add_reference
    # Status index already exists from original migration
    unless index_exists?(:projects, :project_type)
      add_index :projects, :project_type
    end
  end
end
