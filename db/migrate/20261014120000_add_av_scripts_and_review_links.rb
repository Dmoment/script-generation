class AddAvScriptsAndReviewLinks < ActiveRecord::Migration[8.0]
  def change
    # Two-column (audio/video) script rows for ads and promos.
    create_table :av_rows do |t|
      t.references :script_version, null: false, foreign_key: true
      t.integer :position, null: false, default: 1
      t.string :shot                      # "WS", "CU on hands", etc.
      t.text :video, null: false, default: ""
      t.text :audio, null: false, default: ""
      t.text :super_text                  # on-screen text / supers
      t.integer :duration_seconds
      t.text :notes
      t.jsonb :metadata, null: false, default: {}
      t.timestamps
    end
    add_index :av_rows, [:script_version_id, :position]

    # No-login client review of one round (version) of a script.
    create_table :review_links do |t|
      t.references :script_version, null: false, foreign_key: true
      t.uuid :created_by_user_id, null: false
      t.string :token, null: false
      t.string :client_name
      t.string :status, null: false, default: "pending"   # pending | approved | changes_requested
      t.datetime :expires_at
      t.datetime :revoked_at
      t.datetime :decided_at
      t.string :decided_by_name
      t.text :decision_note
      t.timestamps
    end
    add_index :review_links, :token, unique: true
    add_foreign_key :review_links, :users, column: :created_by_user_id

    # Comments left by reviewers through a review link (no account needed).
    create_table :review_comments do |t|
      t.references :review_link, null: false, foreign_key: true
      t.references :av_row, foreign_key: true
      t.references :scene, foreign_key: true
      t.string :author_name, null: false
      t.text :body, null: false
      t.datetime :resolved_at
      t.timestamps
    end
  end
end
