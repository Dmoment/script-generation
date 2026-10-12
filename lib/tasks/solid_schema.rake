namespace :db do
  desc "Load Solid Cache/Queue/Cable schemas into the shared database if their tables are missing"
  task prepare_solid: :environment do
    {
      cache: "solid_cache_entries",
      queue: "solid_queue_jobs",
      cable: "solid_cable_messages"
    }.each do |config_name, marker_table|
      db_config = ActiveRecord::Base.configurations.configs_for(env_name: Rails.env, name: config_name.to_s)
      next unless db_config
      next if ActiveRecord::Base.connection.table_exists?(marker_table)

      puts "Loading #{config_name} schema (#{marker_table} missing)"
      ActiveRecord::Tasks::DatabaseTasks.load_schema(db_config, ActiveRecord.schema_format, nil)
    end
  end
end
