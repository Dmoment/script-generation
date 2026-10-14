# frozen_string_literal: true

# One row of a two-column AV script: what we see (video) beside what we hear
# (audio), with an optional shot label, on-screen super and duration.
class AvRow < ApplicationRecord
  belongs_to :script_version
  has_many :review_comments, dependent: :destroy

  validates :position, numericality: { greater_than: 0 }
  validates :duration_seconds, numericality: { greater_than_or_equal_to: 0, allow_nil: true }
  validates :shot, length: { maximum: 120 }, allow_nil: true

  scope :ordered, -> { order(:position, :id) }

  FIELDS = %w[shot video audio super_text duration_seconds notes].freeze

  def source_row_id
    metadata["source_row_id"]
  end

  def blank?
    video.blank? && audio.blank? && shot.blank? && super_text.blank?
  end
end
