class ApplicationController < ActionController::Base
  # Only allow modern browsers supporting webp images, web push, badges, import maps, CSS nesting, and CSS :has.
  allow_browser versions: :modern
  set_current_tenant_through_filter
  before_action :set_current_tenant

  private

  def set_current_tenant
    subdomain = extract_subdomain(request)

    if subdomain.present?
      company = Company.find_by(subdomain: subdomain)

      if company
        set_current_tenant(company)
      else
        handle_tenant_not_found
      end
    else
      # Handle requests without subdomain (main app, admin, etc.)
      handle_no_subdomain
    end
  end

  def extract_subdomain(request)
    # Extract subdomain from host
    # Example: company.localhost:3000 -> company
    # Example: company.yourapp.com -> company
    subdomain = request.subdomain

    # Skip common subdomains
    return nil if %w[www admin api].include?(subdomain)

    subdomain
  end

  def handle_tenant_not_found
    redirect_to root_url(subdomain: false), alert: 'Company not found'
  end

  def handle_no_subdomain
    # This is the main app without tenant context
    # You can redirect to a landing page or show tenant selection
    # For now, we'll allow it to proceed without a tenant
    ActsAsTenant.current_tenant = nil
  end
end
