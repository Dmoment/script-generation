class CreateScripts < ActiveRecord::Migration[8.0]
  def change
    create_table :scripts do |t|
      t.references :project, null: false, foreign_key: true
      t.string :title, null: false
      t.string :script_type, null: false, default: 'screenplay' # screenplay, treatment, outline, etc.
      t.string :status, null: false, default: 'draft' # draft, active, locked, archived
      t.references :created_by_user, null: false, foreign_key: { to_table: :users }, type: :uuid
      t.text :description

      t.timestamps
    end
  end
end
