class Company < ApplicationRecord
  validates :name, presence: true, length: { minimum: 2, maximum: 100 }
  validates :account_type, inclusion: { in: %w[company individual], allow_nil: true }

  has_many :users, dependent: :nullify
  has_many :access_controls, dependent: :destroy
  has_many :members, through: :access_controls, source: :user

  scope :companies, -> { where(account_type: 'company') }
  scope :individuals, -> { where(account_type: 'individual') }

  def individual?
    account_type == 'individual'
  end

  def company_account?
    account_type == 'company'
  end
end
