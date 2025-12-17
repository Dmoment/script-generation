class ApplicationRecord < ActiveRecord::Base
  primary_abstract_class

  # Include RansackableAttributes for all models
  include RansackableAttributes
end
