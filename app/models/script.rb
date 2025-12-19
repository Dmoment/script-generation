# frozen_string_literal: true

class Script < ApplicationRecord
  belongs_to :project
  belongs_to :created_by_user, class_name: 'User', foreign_key: 'created_by_user_id'
  has_many :script_versions, dependent: :destroy

  self.whitelisted_ransackable_attributes = %w[
    title
    script_type
    status
    description
    project_id
    created_by_user_id
  ]

  validates :title, presence: true, length: { minimum: 1, maximum: 200 }
  validates :script_type, presence: true, inclusion: { in: %w[screenplay treatment outline other] }
  validates :status, presence: true, inclusion: { in: %w[draft active locked archived] }

  scope :active, -> { where(status: "active") }
  scope :draft, -> { where(status: "draft") }
  scope :archived, -> { where(status: "archived") }
  scope :by_project, ->(project_id) { where(project_id: project_id) }
  scope :by_type, ->(type) { where(script_type: type) }

  def latest_version
    script_versions.order(version_number: :desc).first
  end

  def version_count
    script_versions.count
  end
end
