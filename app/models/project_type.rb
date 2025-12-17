class ProjectType < ApplicationRecord
  validates :name, presence: true, uniqueness: { case_sensitive: false }, length: { minimum: 1, maximum: 50 }

  scope :recent, -> { order(created_at: :desc) }
  scope :search, ->(term) { where("LOWER(name) LIKE ?", "%#{term.downcase}%") }
end
