class CreateScenes < ActiveRecord::Migration[8.0]
  def change
    create_table :scenes do |t|
      t.references :script_version, null: false, foreign_key: true, type: :bigint
      t.integer :scene_number, null: false
      t.string :slugline
      t.text :content
      t.integer :order, null: false, default: 0
      t.jsonb :metadata, default: {}

      t.timestamps
    end

    add_index :scenes, [:script_version_id, :scene_number], unique: true
    add_index :scenes, [:script_version_id, :order]
  end
end
