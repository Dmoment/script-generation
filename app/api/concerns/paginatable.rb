# frozen_string_literal: true

module Paginatable
  extend ActiveSupport::Concern

  included do
    helpers do
      # Format paginated results with metadata
      # Usage: paginate_collection(collection) { |item| Entity.represent(item) }
      def paginate_collection(collection, page: nil, per_page: nil)
        page ||= params[:page] || 1
        per_page ||= params[:per_page] || 20

        paginated = collection.page(page).per(per_page)

        data = if block_given?
          paginated.map { |item| yield(item) }
        else
          paginated.to_a
        end

        {
          data: data,
          pagination: {
            page: paginated.current_page,
            per_page: paginated.limit_value,
            total: paginated.total_count,
            total_pages: paginated.total_pages,
            has_next: paginated.next_page.present?,
            has_prev: paginated.prev_page.present?
          }
        }
      end
    end
  end
end
