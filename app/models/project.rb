# frozen_string_literal: true

class Project < ApplicationRecord
  # Add validations
  validates :name, presence: true
  validates :status, inclusion: { in: %w[active completed draft] }

  # Default scope
  scope :active, -> { where(status: "active") }
  scope :completed, -> { where(status: "completed") }
  scope :draft, -> { where(status: "draft") }

  # Add associations if needed
  # belongs_to :user
end
