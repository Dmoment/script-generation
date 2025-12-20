# frozen_string_literal: true

# Concern for parsing multipart/form-data in Grape APIs
# Grape's format :json interferes with multipart parsing, so we use ActionDispatch::Request
module MultipartParams
  extend ActiveSupport::Concern

  private

  # Parse multipart form data and extract parameters
  # Returns a hash with string keys containing all form fields
  #
  # @param env [Hash] Rack environment hash
  # @return [Hash] Parsed form parameters with string keys
  def parse_multipart_params(env)
    rails_request = ActionDispatch::Request.new(env)
    rails_request.params
  end

  # Extract and validate required parameters from multipart form data
  # Converts file upload to hash format for service objects
  #
  # @param form_params [Hash] Parsed form parameters
  # @param required_fields [Array<String>] List of required field names
  # @param file_field [String] Name of the file field (default: 'file')
  # @return [Hash] Hash containing:
  #   - :params [Hash] All extracted parameters (symbol keys)
  #   - :file_hash [Hash, nil] File in hash format if present
  #   - :errors [Array<String>] Validation errors
  def extract_multipart_params(form_params, required_fields: [], file_field: 'file')
    errors = []
    extracted_params = {}
    file_hash = nil

    # Extract all non-file parameters
    form_params.each do |key, value|
      next if value.is_a?(ActionDispatch::Http::UploadedFile)
      extracted_params[key.to_sym] = value
    end

    # Validate required fields
    required_fields.each do |field|
      if field == file_field
        # File validation is handled separately
        next
      elsif form_params[field].blank?
        errors << "#{field} is required"
      end
    end

    # Extract and convert file if present
    uploaded_file = form_params[file_field]
    if required_fields.include?(file_field)
      if uploaded_file.blank?
        errors << "#{file_field} is required"
      elsif uploaded_file.is_a?(ActionDispatch::Http::UploadedFile)
        file_hash = {
          tempfile: uploaded_file.tempfile,
          filename: uploaded_file.original_filename || uploaded_file.filename,
          type: uploaded_file.content_type
        }
      else
        errors << "Invalid file object: #{uploaded_file.class}"
      end
    elsif uploaded_file.present? && uploaded_file.is_a?(ActionDispatch::Http::UploadedFile)
      # Optional file field
      file_hash = {
        tempfile: uploaded_file.tempfile,
        filename: uploaded_file.original_filename || uploaded_file.filename,
        type: uploaded_file.content_type
      }
    end

    {
      params: extracted_params,
      file_hash: file_hash,
      errors: errors
    }
  end
end
