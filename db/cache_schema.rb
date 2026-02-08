# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_12_22_153716) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "access_controls", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.uuid "user_id", null: false
    t.bigint "company_id", null: false
    t.bigint "project_id"
    t.string "role", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["company_id"], name: "index_access_controls_on_company_id"
    t.index ["project_id"], name: "index_access_controls_on_project_id"
    t.index ["user_id", "company_id", "project_id"], name: "index_access_controls_project_unique", unique: true, where: "(project_id IS NOT NULL)"
    t.index ["user_id", "company_id"], name: "index_access_controls_company_unique", unique: true, where: "(project_id IS NULL)"
    t.index ["user_id"], name: "index_access_controls_on_user_id"
  end

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "companies", force: :cascade do |t|
    t.string "name", null: false
    t.string "subdomain"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "account_type", default: "company"
  end

  create_table "project_types", force: :cascade do |t|
    t.string "name", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["name"], name: "index_project_types_on_name", unique: true
  end

  create_table "projects", force: :cascade do |t|
    t.string "title", null: false
    t.text "description"
    t.string "status", default: "draft", null: false
    t.decimal "budget", precision: 10, scale: 2
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "company_id", null: false
    t.uuid "created_by_user_id", null: false
    t.string "project_type", default: "film", null: false
    t.index ["company_id"], name: "index_projects_on_company_id"
    t.index ["created_by_user_id"], name: "index_projects_on_created_by_user_id"
    t.index ["project_type"], name: "index_projects_on_project_type"
    t.index ["status"], name: "index_projects_on_status"
  end

  create_table "scenes", force: :cascade do |t|
    t.bigint "script_version_id", null: false
    t.integer "scene_number", null: false
    t.string "slugline"
    t.text "content"
    t.integer "order", default: 0, null: false
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["script_version_id", "order"], name: "index_scenes_on_script_version_id_and_order"
    t.index ["script_version_id", "scene_number"], name: "index_scenes_on_script_version_id_and_scene_number", unique: true
    t.index ["script_version_id"], name: "index_scenes_on_script_version_id"
  end

  create_table "script_versions", force: :cascade do |t|
    t.bigint "script_id", null: false
    t.integer "version_number", default: 1, null: false
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["script_id", "version_number"], name: "index_script_versions_on_script_id_and_version_number", unique: true
    t.index ["script_id"], name: "index_script_versions_on_script_id"
  end

  create_table "scripts", force: :cascade do |t|
    t.bigint "project_id", null: false
    t.string "title", null: false
    t.string "script_type", default: "screenplay", null: false
    t.string "status", default: "draft", null: false
    t.uuid "created_by_user_id", null: false
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["created_by_user_id"], name: "index_scripts_on_created_by_user_id"
    t.index ["project_id"], name: "index_scripts_on_project_id"
  end

  create_table "users", id: :uuid, default: -> { "gen_random_uuid()" }, force: :cascade do |t|
    t.string "name", null: false
    t.string "email", null: false
    t.string "image"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "auth0_id"
    t.string "gender"
    t.string "phone_number"
    t.bigint "company_id"
    t.boolean "onboarding_completed", default: false, null: false
    t.string "role", default: "member"
    t.index ["auth0_id"], name: "index_users_on_auth0_id", unique: true
    t.index ["company_id"], name: "index_users_on_company_id"
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "access_controls", "companies"
  add_foreign_key "access_controls", "projects"
  add_foreign_key "access_controls", "users"
  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "projects", "companies"
  add_foreign_key "projects", "users", column: "created_by_user_id"
  add_foreign_key "scenes", "script_versions"
  add_foreign_key "script_versions", "scripts"
  add_foreign_key "scripts", "projects"
  add_foreign_key "scripts", "users", column: "created_by_user_id"
  add_foreign_key "users", "companies"
end
