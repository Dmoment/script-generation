# frozen_string_literal: true

# A shareable, no-login link that lets a client read one round of a script,
# leave comments and approve it (or ask for changes).
class ReviewLink < ApplicationRecord
  STATUSES = %w[pending approved changes_requested].freeze

  belongs_to :script_version
  belongs_to :created_by_user, class_name: "User"
  has_many :review_comments, dependent: :destroy

  has_secure_token :token, length: 32

  validates :status, inclusion: { in: STATUSES }
  validates :client_name, length: { maximum: 120 }, allow_nil: true

  scope :active, -> { where(revoked_at: nil) }
  scope :recent, -> { order(created_at: :desc) }

  def expired?
    expires_at.present? && expires_at < Time.current
  end

  def revoked?
    revoked_at.present?
  end

  def usable?
    !expired? && !revoked?
  end

  def decide!(decision, name:, note: nil)
    raise ArgumentError, "unknown decision" unless %w[approved changes_requested].include?(decision)

    update!(status: decision, decided_at: Time.current, decided_by_name: name, decision_note: note)
  end

  def script
    script_version.script
  end
end
