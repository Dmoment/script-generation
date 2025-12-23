# frozen_string_literal: true

class User < ApplicationRecord
  # Validations
  validates :auth0_id, presence: true, uniqueness: true
  # validates :email, presence: true, uniqueness: true
  # validates :name, presence: true
  validates :gender, inclusion: { in: %w[male female other], allow_nil: true }
  validates :role, inclusion: { in: %w[super_admin], allow_nil: true } # Only super_admin stored here, others in access_controls

  belongs_to :company, optional: true # Primary/default company (for backward compatibility)
  has_many :access_controls, dependent: :destroy
  has_many :companies, through: :access_controls, source: :company
  has_many :projects, dependent: :destroy, foreign_key: 'created_by_user_id'
  has_many :accessible_projects, through: :access_controls, source: :project

  scope :onboarded, -> { where(onboarding_completed: true) }
  scope :pending_onboarding, -> { where(onboarding_completed: false) }

  before_validation :normalize_email

  def onboarding_required?
    !onboarding_completed?
  end

  def super_admin?
    role == 'super_admin'
  end

  def company_admin?(company_id = nil)
    return false if super_admin? # Super admin doesn't need company_admin check
    company_id ||= self.company_id
    return false unless company_id
    access_controls.company_admins.exists?(company_id: company_id)
  end

  def company_member?(company_id = nil)
    return false if super_admin?
    company_id ||= self.company_id
    return false unless company_id
    access_controls.company_members.exists?(company_id: company_id)
  end

  def role_in_company(company_id)
    return 'super_admin' if super_admin?
    ac = access_controls.company_level.find_by(company_id: company_id)
    ac&.role || 'company_member'
  end

  # Legacy methods for backward compatibility (check primary company)
  def admin? # Legacy method for backward compatibility
    company_admin? || super_admin?
  end

  # Check if user has access to a project
  def can_access_project?(project)
    return true if super_admin?
    return true if company_admin? && same_company?(project)
    return true if project_admin_for?(project)
    return true if member_of_project?(project)
    return true if created_record?(project)
    false
  end

  def project_admin_for?(project)
    return false unless project
    # Company admins are always project admins in their company
    return true if company_admin?(project.company_id)
    access_controls.project_admins.exists?(project_id: project.id)
  end

  def member_of_project?(project)
    return false unless project
    # Company admins are always members in their company
    return true if company_admin?(project.company_id)
    access_controls.project_level.exists?(project_id: project.id)
  end

  private

  def same_company?(project)
    return false unless project&.company_id
    # Check if user is in the project's company (via access_controls or primary company)
    company_id == project.company_id || access_controls.company_level.exists?(company_id: project.company_id)
  end

  def created_record?(project)
    project.respond_to?(:created_by_user_id) && project.created_by_user_id == id
  end

  private

  def normalize_email
    self.email = email.downcase.strip if email.present?
  end
end
