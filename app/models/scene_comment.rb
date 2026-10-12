# frozen_string_literal: true

# A note on a scene (optionally anchored to one element by its client id).
# Replies reference their root through parent_id; only roots are resolved.
class SceneComment < ApplicationRecord
  belongs_to :scene
  belongs_to :user
  belongs_to :parent, class_name: "SceneComment", optional: true
  has_many :replies, class_name: "SceneComment", foreign_key: :parent_id, dependent: :destroy, inverse_of: :parent

  validates :body, presence: true, length: { maximum: 5000 }
  validate :reply_targets_root

  scope :roots, -> { where(parent_id: nil) }
  scope :open, -> { where(resolved_at: nil) }
  scope :chronological, -> { order(:created_at) }

  def resolved?
    resolved_at.present?
  end

  private

  def reply_targets_root
    errors.add(:parent, "must be a top-level comment") if parent&.parent_id.present?
  end
end
