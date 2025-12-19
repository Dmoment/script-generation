# frozen_string_literal: true

class ScriptPolicy < ApplicationPolicy
  def index?
    # Super admin can see all
    return true if super_admin?
    # Company admin can see all in their company
    project = record.respond_to?(:project) ? record.project : nil
    return true if project && company_admin?(project.company_id) && same_company?(project)
    # Project admin can see all in their projects
    return true if project && project_admin_for?(project)
    # Regular users can see scripts in projects they're part of
    return true if project && member_of_project?(project)
    # Users can see scripts they created
    return true if created_record?(record)
    false
  end

  def show?
    index?
  end

  def create?
    # Super admin can create anywhere
    return true if super_admin?
    # Company admin can create in their company's projects
    project = record.respond_to?(:project) ? record.project : nil
    return true if project && company_admin?(project.company_id) && same_company?(project)
    # Project admin can create in their projects
    return true if project && project_admin_for?(project)
    # Regular users can create in projects they're part of
    return true if project && member_of_project?(project)
    false
  end

  def update?
    # Super admin can update anything
    return true if super_admin?
    # Company admin can update in their company
    project = record.respond_to?(:project) ? record.project : nil
    return true if project && company_admin?(project.company_id) && same_company?(project)
    # Project admin can update in their projects
    return true if project && project_admin_for?(project)
    # Regular users can update scripts they created
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

      # Company admins see all scripts in their companies
      admin_company_ids = user.access_controls.company_admins.pluck(:company_id)
      if admin_company_ids.any?
        return scope.joins(:project).where(projects: { company_id: admin_company_ids })
      end

      # Project admins see scripts in their projects
      project_ids = user.access_controls.project_admins.pluck(:project_id)
      if project_ids.any?
        return scope.where(project_id: project_ids)
      end

      # Company members see scripts in projects they're part of or scripts they created, in their companies
      member_project_ids = user.access_controls.project_level.pluck(:project_id)
      scope.where(project_id: member_project_ids)
          .or(scope.where(created_by_user_id: user.id))
          .joins(:project)
          .where(projects: { company_id: company_ids.compact.uniq })
    end
  end
end
