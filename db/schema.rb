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

ActiveRecord::Schema[8.0].define(version: 2025_12_17_163324) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

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

  add_foreign_key "projects", "companies"
  add_foreign_key "projects", "users", column: "created_by_user_id"
  add_foreign_key "users", "companies"
end
