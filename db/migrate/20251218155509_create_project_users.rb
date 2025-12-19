class CreateProjectUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :project_users, id: :uuid do |t|
      t.references :project, null: false, foreign_key: true, type: :bigint
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.string :role, null: false, default: 'member' # member, admin (project_admin)
      t.timestamps
    end

    add_index :project_users, [:project_id, :user_id], unique: true unless index_exists?(:project_users, [:project_id, :user_id])
    add_index :project_users, :user_id unless index_exists?(:project_users, :user_id)
  end
end
