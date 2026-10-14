# frozen_string_literal: true

class ScriptVersion < ApplicationRecord
  belongs_to :script
  has_one_attached :file
  has_many :scenes, dependent: :destroy
  has_many :av_rows, dependent: :destroy
  has_many :review_links, dependent: :destroy

  def av?
    script.av?
  end

  # One-glance state of client review for this round, built from the loaded
  # links so list endpoints can include it without extra queries.
  def review_summary
    live = review_links.reject(&:revoked?)
    decided = live.select(&:decided_at).max_by(&:decided_at)
    {
      status: live.empty? ? "unshared" : (decided ? decided.status : "pending"),
      decided_by_name: decided&.decided_by_name,
      decided_at: decided&.decided_at,
      decision_note: decided&.decision_note,
      client_name: (decided || live.max_by(&:created_at))&.client_name,
      links: live.size,
      pending_links: live.count { |l| l.decided_at.nil? },
      open_comments: live.sum { |l| l.review_comments.count { |c| c.resolved_at.nil? } }
    }
  end

  def previous_version
    script.script_versions.where("version_number < ?", version_number).order(version_number: :desc).first
  end

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
