# frozen_string_literal: true

GrapeSwaggerRails.options.tap do |config|
  config.url = "/api/v1/swagger_doc"
  config.app_url = "/"
  config.app_name = "Script Generation API"
  config.doc_expansion = "list"
  config.hide_url_input = false
end
