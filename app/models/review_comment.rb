# frozen_string_literal: true

# A reviewer's note left through a review link, optionally pinned to one AV
# row (or scene). Reviewers have no account, so the name is free text.
class ReviewComment < ApplicationRecord
  belongs_to :review_link
  belongs_to :av_row, optional: true
  belongs_to :scene, optional: true

  validates :author_name, presence: true, length: { maximum: 120 }
  validates :body, presence: true, length: { maximum: 5000 }
  validate :anchor_belongs_to_reviewed_version

  scope :chronological, -> { order(:created_at) }
  scope :open, -> { where(resolved_at: nil) }

  def resolved?
    resolved_at.present?
  end

  private

  def anchor_belongs_to_reviewed_version
    version_id = review_link&.script_version_id
    errors.add(:av_row, "is not part of this round") if av_row && av_row.script_version_id != version_id
    errors.add(:scene, "is not part of this round") if scene && scene.script_version_id != version_id
  end
end
