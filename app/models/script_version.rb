# frozen_string_literal: true

class ScriptVersion < ApplicationRecord
  belongs_to :script

  validates :version_number, presence: true, uniqueness: { scope: :script_id }
  validates :version_number, numericality: { greater_than: 0 }

  before_validation :set_version_number, on: :create, if: -> { version_number.nil? }

  scope :ordered, -> { order(version_number: :desc) }
  scope :by_script, ->(script_id) { where(script_id: script_id) }

  private

  def set_version_number
    max_version = script.script_versions.maximum(:version_number) || 0
    self.version_number = max_version + 1
  end
end
