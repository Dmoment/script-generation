class RemoveUsageCountFromProjectTypes < ActiveRecord::Migration[8.0]
  def change
    remove_index :project_types, :usage_count if index_exists?(:project_types, :usage_count)
    remove_column :project_types, :usage_count, :integer if column_exists?(:project_types, :usage_count)
  end
end
