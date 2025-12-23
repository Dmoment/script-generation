# frozen_string_literal: true

class ApplicationPolicy
  attr_reader :user, :record

  def initialize(user, record)
    @user = user
    @record = record
  end

  def index?
    false
  end

  def show?
    false
  end

  def create?
    false
  end

  def new?
    create?
  end

  def update?
    false
  end

  def edit?
    update?
  end

  def destroy?
    false
  end

  class Scope
    def initialize(user, scope)
      @user = user
      @scope = scope
    end

    def resolve
      raise NotImplementedError, "You must define #resolve in #{self.class}"
    end

    private

    attr_reader :user, :scope
  end

  private

  def super_admin?
    user&.super_admin?
  end

  # Company-specific role checks
  def company_admin?(company_id = nil)
    return false if super_admin?
    company_id ||= extract_company_id(record)
    return false unless company_id
    user.company_admin?(company_id)
  end

  def company_member?(company_id = nil)
    return false if super_admin?
    company_id ||= extract_company_id(record)
    return false unless company_id
    user.company_member?(company_id)
  end

  def same_company?(record)
    return false unless user && record.respond_to?(:company_id)
    company_id = record.company_id
    return false unless company_id
    # Check if user is in the company (via access_controls or primary company)
    user.company_id == company_id || user.access_controls.company_level.exists?(company_id: company_id)
  end

  # Extract company_id from record (could be a project, script, etc.)
  def extract_company_id(record)
    return nil unless record
    if record.respond_to?(:company_id)
      record.company_id
    elsif record.respond_to?(:project) && record.project
      record.project.company_id
    else
      nil
    end
  end

  def project_admin_for?(project)
    return false unless project && user
    # Company admins are always project admins in their company
    return true if user.company_admin?(project.company_id)
    project.access_controls.project_admins.exists?(user_id: user.id)
  end

  def member_of_project?(project)
    return false unless project && user
    # Company admins are always members in their company
    return true if user.company_admin?(project.company_id)
    project.access_controls.project_level.exists?(user_id: user.id)
  end

  def created_record?(record)
    return false unless record.respond_to?(:created_by_user_id)
    record.created_by_user_id == user&.id
  end
end
