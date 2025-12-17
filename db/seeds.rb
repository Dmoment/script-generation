# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

# Create demo companies for multi-tenancy
companies_data = [
  {
    name: "Demo Company",
    subdomain: "demo"
  },
  {
    name: "ACME Corporation",
    subdomain: "acme"
  },
  {
    name: "Tech Startup Inc",
    subdomain: "techstartup"
  }
]

companies_data.each do |company_attrs|
  company = Company.find_or_create_by(subdomain: company_attrs[:subdomain]) do |c|
    c.name = company_attrs[:name]
  end

  puts "✅ Company created: #{company.name} (#{company.subdomain})"
end

# Create default project types
project_types_data = [
  'Film',
  'Series',
  'Short',
  'Ad',
  'Documentary',
  'Commercial',
  'Music Video',
  'Web Series',
  'Other'
]

project_types_data.each do |type_name|
  ProjectType.find_or_create_by(name: type_name)
  puts "✅ Project type created: #{type_name}"
end

puts "🌱 Seed data created successfully!"
puts "📋 Available companies:"
Company.all.each do |company|
  puts "   - #{company.name}: https://#{company.subdomain}.yourapp.onrender.com"
end
