class CreateProjectTypes < ActiveRecord::Migration[8.0]
  def change
    create_table :project_types do |t|
      t.string :name, null: false

      t.timestamps
    end

    add_index :project_types, :name, unique: true
  end
end
