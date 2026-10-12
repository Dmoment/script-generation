class AddElementsToScenes < ActiveRecord::Migration[8.0]
  def change
    add_column :scenes, :elements, :jsonb, default: [], null: false

    # Add index for querying elements (e.g., finding all scenes with a specific character)
    add_index :scenes, :elements, using: :gin
  end
end
