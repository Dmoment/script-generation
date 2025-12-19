class DropProjectUsersTable < ActiveRecord::Migration[8.0]
  def up
    drop_table :project_users if table_exists?(:project_users)
  end

  def down
    # Recreate project_users table if needed for rollback
    create_table :project_users, id: :uuid do |t|
      t.references :project, null: false, foreign_key: true, type: :bigint
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.string :role, null: false, default: 'member'
      t.timestamps
    end

    add_index :project_users, [:project_id, :user_id], unique: true
    add_index :project_users, :user_id
  end
end
