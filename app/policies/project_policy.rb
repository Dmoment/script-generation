# frozen_string_literal: true

class ProjectPolicy < ApplicationPolicy
  def index?
    # Everyone can list projects (scope will filter)
    true
  end

  def show?
    # Super admin can see all
    return true if super_admin?
    # Company admin can see projects in their company
    return true if company_admin?(record.company_id) && same_company?(record)
    # Project admin can see their projects
    return true if project_admin_for?(record)
    # Regular users can see projects they're part of
    return true if member_of_project?(record)
    # Users can see projects they created
    return true if created_record?(record)
    false
  end

  def create?
    # Super admin can create anywhere
    return true if super_admin?
    # Company admin can create in their company
    return true if company_admin?(record.company_id) && same_company?(record)
    # Company members can create projects in their company
    return true if same_company?(record) && (company_member?(record.company_id) || user.company_id == record.company_id)
    false
  end

  def update?
    # Super admin can update anything
    return true if super_admin?
    # Company admin can update in their company
    return true if company_admin?(record.company_id) && same_company?(record)
    # Project admin can update their projects
    return true if project_admin_for?(record)
    # Regular users can update projects they created
    return true if created_record?(record)
    false
  end

  def destroy?
    update?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      # Super admin sees all
      return scope.all if user.super_admin?

      # Get all company IDs where user has a role
      company_ids = user.access_controls.company_level.pluck(:company_id)
      company_ids << user.company_id if user.company_id # Include primary company

      # Company admins see all projects in their companies
      admin_company_ids = user.access_controls.company_admins.pluck(:company_id)
      if admin_company_ids.any?
        return scope.where(company_id: admin_company_ids)
      end

      # Project admins see their projects
      project_ids = user.access_controls.project_admins.pluck(:project_id)
      if project_ids.any?
        return scope.where(id: project_ids)
      end

      # Company members see projects they're part of or created, in their companies
      member_project_ids = user.access_controls.project_level.pluck(:project_id)
      scope.where(id: member_project_ids)
          .or(scope.where(created_by_user_id: user.id))
          .where(company_id: company_ids.compact.uniq)
    end
  end
end
