class CreateScriptVersions < ActiveRecord::Migration[8.0]
  def change
    create_table :script_versions do |t|
      t.references :script, null: false, foreign_key: true
      t.integer :version_number, null: false, default: 1
      t.text :notes # Version notes/changelog

      t.timestamps
    end

    add_index :script_versions, [:script_id, :version_number], unique: true
  end
end
