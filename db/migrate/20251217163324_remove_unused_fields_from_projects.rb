class RemoveUnusedFieldsFromProjects < ActiveRecord::Migration[8.0]
  def change
    remove_column :projects, :stage, :string if column_exists?(:projects, :stage)
    remove_column :projects, :genre, :string if column_exists?(:projects, :genre)
    remove_column :projects, :language, :string if column_exists?(:projects, :language)
    remove_column :projects, :logline, :text if column_exists?(:projects, :logline)
    remove_column :projects, :budget_range, :string if column_exists?(:projects, :budget_range)
    remove_column :projects, :shooting_location, :string if column_exists?(:projects, :shooting_location)
    remove_column :projects, :release_type, :string if column_exists?(:projects, :release_type)
  end
end
