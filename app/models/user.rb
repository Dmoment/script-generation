# frozen_string_literal: true

class User < ApplicationRecord
  # Validations
  validates :auth0_id, presence: true, uniqueness: true
  # validates :email, presence: true, uniqueness: true
  # validates :name, presence: true
  validates :gender, inclusion: { in: %w[male female other], allow_nil: true }
  validates :role, inclusion: { in: %w[admin member], allow_nil: true }

  # Associations
  belongs_to :company, optional: true
  has_many :projects, dependent: :destroy

  # Scopes
  scope :onboarded, -> { where(onboarding_completed: true) }
  scope :pending_onboarding, -> { where(onboarding_completed: false) }

  # Callbacks
  before_validation :normalize_email

  # Instance methods
  def onboarding_required?
    !onboarding_completed?
  end

  def admin?
    role == 'admin'
  end

  private

  def normalize_email
    self.email = email.downcase.strip if email.present?
  end
end
