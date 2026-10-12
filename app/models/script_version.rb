# frozen_string_literal: true

class ScriptVersion < ApplicationRecord
  belongs_to :script
  has_one_attached :file
  has_many :scenes, dependent: :destroy

  def numbers_locked?
    scene_numbers_locked_at.present?
  end

  validates :version_number, presence: true, uniqueness: { scope: :script_id }
  validates :version_number, numericality: { greater_than: 0 }

  # The column defaults to 1, so "no explicit number" shows up as an unchanged
  # default rather than nil; compute the next number in both cases.
  before_validation :set_version_number, on: :create, if: -> { version_number.nil? || !will_save_change_to_version_number? }

  scope :ordered, -> { order(version_number: :desc) }
  scope :by_script, ->(script_id) { where(script_id: script_id) }

  private

  def set_version_number
    max_version = script.script_versions.maximum(:version_number) || 0
    self.version_number = max_version + 1
  end
end
