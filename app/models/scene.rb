# frozen_string_literal: true

class Scene < ApplicationRecord
  belongs_to :script_version

  self.whitelisted_ransackable_attributes = %w[
    scene_number
    slugline
    script_version_id
    order
  ]

  validates :scene_number, presence: true, uniqueness: { scope: :script_version_id }
  validates :scene_number, numericality: { greater_than: 0 }
  validates :order, presence: true, numericality: { greater_than_or_equal_to: 0 }

  scope :ordered, -> { order(:order, :scene_number) }
  scope :by_version, ->(version_id) { where(script_version_id: version_id) }

  before_validation :set_default_order, on: :create, if: -> { order.nil? || order.zero? }

  private

  def set_default_order
    return if order.present? && order.positive?

    max_order = script_version.scenes.maximum(:order) || 0
    self.order = max_order + 1
  end
end
