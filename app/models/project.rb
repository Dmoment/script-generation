# frozen_string_literal: true

class Project < ApplicationRecord
  # Associations
  belongs_to :company
  belongs_to :created_by_user, class_name: 'User', foreign_key: 'created_by_user_id'
  has_many :scripts, dependent: :destroy
  has_many :access_controls, dependent: :destroy
  has_many :users, through: :access_controls, source: :user

  # Ransack configuration
  self.whitelisted_ransackable_attributes = %w[
    title
    description
    status
    project_type
    budget
    company_id
    created_by_user_id
  ]

  # Validations
  validates :title, presence: true, length: { minimum: 1, maximum: 200 }
  validates :status, inclusion: { in: %w[draft active locked archived] }
  validates :project_type, presence: true, length: { minimum: 1, maximum: 50 }

  # Scopes
  scope :active, -> { where(status: "active") }
  scope :completed, -> { where(status: "archived") } # Archived = completed
  scope :draft, -> { where(status: "draft") }
  scope :by_company, ->(company_id) { where(company_id: company_id) }
  scope :by_type, ->(type) { where(project_type: type) }

  # Defaults
  after_initialize :set_defaults, if: :new_record?
  after_create :grant_creator_project_admin_access

  private

  def set_defaults
    self.status ||= 'draft'
    self.project_type ||= 'film'
  end

  def grant_creator_project_admin_access
    return unless created_by_user_id && company_id

    AccessControl.find_or_create_by!(
      user_id: created_by_user_id,
      company_id: company_id,
      project_id: id
    ) do |ac|
      ac.role = 'project_admin'
    end
  end
end
