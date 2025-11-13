class AddAuth0IdToUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :auth0_id, :string unless column_exists?(:users, :auth0_id)
    add_index :users, :auth0_id, unique: true unless index_exists?(:users, :auth0_id)
  end
end
