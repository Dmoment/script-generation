class Company < ApplicationRecord
  acts_as_tenant

  validates :name, presence: true, length: { minimum: 2, maximum: 100 }
end
