# frozen_string_literal: true

class User < ApplicationRecord
  # Validations
  validates :auth0_id, presence: true, uniqueness: true
  # validates :email, presence: true, uniqueness: true
  # validates :name, presence: true

  # Associations
  has_many :projects, dependent: :destroy

  # Callbacks
  before_validation :normalize_email

  private

  def normalize_email
    self.email = email.downcase.strip if email.present?
  end
end
