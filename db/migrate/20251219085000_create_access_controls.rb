class CreateAccessControls < ActiveRecord::Migration[8.0]
  def change
    create_table :access_controls, id: :uuid do |t|
      t.references :user, null: false, foreign_key: true, type: :uuid
      t.references :company, null: false, foreign_key: true, type: :bigint # companies.id is bigint
      t.references :project, null: true, foreign_key: true, type: :bigint # NULL = company-level role
      t.string :role, null: false # company_admin, company_member, project_admin, project_member

      t.timestamps
    end

    # Unique constraint for project-level roles (project_id IS NOT NULL)
    # PostgreSQL partial unique index
    execute <<-SQL
      CREATE UNIQUE INDEX index_access_controls_project_unique
      ON access_controls (user_id, company_id, project_id)
      WHERE project_id IS NOT NULL
    SQL

    # Unique constraint for company-level roles (project_id IS NULL)
    execute <<-SQL
      CREATE UNIQUE INDEX index_access_controls_company_unique
      ON access_controls (user_id, company_id)
      WHERE project_id IS NULL
    SQL
  end
end
