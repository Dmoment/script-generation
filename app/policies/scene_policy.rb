# frozen_string_literal: true

class ScenePolicy < ApplicationPolicy
  def index?
    script_version_accessible?
  end

  def show?
    script_version_accessible?
  end

  def create?
    script_version_accessible?
  end

  def update?
    script_version_accessible?
  end

  def destroy?
    script_version_accessible?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless user

      if user.super_admin?
        return scope.all
      end

      script_ids = ScriptPolicy::Scope.new(user, Script).resolve.pluck(:id)
      script_version_ids = ScriptVersion.where(script_id: script_ids).pluck(:id)
      scope.where(script_version_id: script_version_ids)
    end
  end

  private

  def script_version_accessible?
    return false unless record&.script_version

    script_version = record.script_version
    script = script_version.script
    project = script.project

    return true if user.super_admin?
    return true if project && company_admin?(project.company_id) && same_company?(project)
    return true if project && project_admin_for?(project)
    return true if project && member_of_project?(project)
    return true if created_record?(script)

    false
  end
end
