class Company < ApplicationRecord
  # Validations
  validates :name, presence: true, length: { minimum: 2, maximum: 100 }
  validates :account_type, inclusion: { in: %w[company individual], allow_nil: true }

  # Associations
  has_many :users, dependent: :nullify

  # Scopes
  scope :companies, -> { where(account_type: 'company') }
  scope :individuals, -> { where(account_type: 'individual') }

  # Instance methods
  def individual?
    account_type == 'individual'
  end

  def company_account?
    account_type == 'company'
  end
end
