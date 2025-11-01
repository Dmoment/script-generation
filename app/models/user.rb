# frozen_string_literal: true

class User < ApplicationRecord
  # Add validations
  validates :name, presence: true
  validates :email, presence: true, uniqueness: true

  # Add associations if needed
  # has_many :projects
end
