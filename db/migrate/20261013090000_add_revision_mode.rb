class AddRevisionMode < ActiveRecord::Migration[8.0]
  def change
    add_column :script_versions, :scene_numbers_locked_at, :datetime
    add_column :script_versions, :revision_color, :string
    add_column :script_versions, :revision_date, :date

    create_table :scene_comments do |t|
      t.references :scene, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.references :parent, foreign_key: { to_table: :scene_comments }
      t.text :body, null: false
      t.string :element_id
      t.datetime :resolved_at
      t.timestamps
    end
    add_index :scene_comments, [ :scene_id, :created_at ]
  end
end
