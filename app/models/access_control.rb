# frozen_string_literal: true

class AccessControl < ApplicationRecord
  belongs_to :user
  belongs_to :company
  belongs_to :project, optional: true

  validates :role, presence: true, inclusion: {
    in: %w[company_admin company_member project_admin project_member]
  }

  validate :project_belongs_to_company, if: -> { project_id.present? }

  # Ensure uniqueness: one role per user per company (when project_id is NULL)
  validates :user_id, uniqueness: {
    scope: [:company_id, :project_id],
    message: "already has a role for this company/project combination"
  }

  # Scopes
  scope :company_level, -> { where(project_id: nil) }
  scope :project_level, -> { where.not(project_id: nil) }
  scope :company_admins, -> { company_level.where(role: 'company_admin') }
  scope :company_members, -> { company_level.where(role: 'company_member') }
  scope :project_admins, -> { project_level.where(role: 'project_admin') }
  scope :project_members, -> { project_level.where(role: 'project_member') }

  private

  def project_belongs_to_company
    return unless project && company_id

    unless project.company_id == company_id
      errors.add(:project_id, "must belong to the same company")
    end
  end
end
