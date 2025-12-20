# frozen_string_literal: true

class ScriptUploadService
  MAX_FILE_SIZE = 50.megabytes

  attr_reader :project, :user, :params

  def initialize(project:, user:, params:)
    @project = project
    @user = user
    @params = params
  end

  def call
    validate_file_presence
    validate_file_size
    create_script_with_version
  rescue ScriptUploadError::Base => e
    # Re-raise custom exceptions as-is
    raise e
  rescue StandardError => e
    Rails.logger.error "ScriptUploadService unexpected error: #{e.class} - #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    raise ScriptUploadError::AttachmentError, "Upload failed: #{e.message}"
  end

  private

  def validate_file_presence
    unless uploaded_file.present?
      raise ScriptUploadError::FileValidationError, "File is required"
    end

    Rails.logger.debug "Uploaded file class: #{uploaded_file.class}"
  end

  def validate_file_size
    return unless uploaded_file.present?

    file_size = if uploaded_file.is_a?(Hash) && uploaded_file[:tempfile].respond_to?(:size)
                  uploaded_file[:tempfile].size
                elsif uploaded_file.respond_to?(:size)
                  uploaded_file.size
                elsif uploaded_file.respond_to?(:tempfile) && uploaded_file.tempfile.respond_to?(:size)
                  uploaded_file.tempfile.size
                else
                  nil
                end

    if file_size && file_size > MAX_FILE_SIZE
      raise ScriptUploadError::FileValidationError,
            "File size too large (max #{MAX_FILE_SIZE / 1.megabyte}MB)"
    end
  end

  def create_script_with_version
    script = Script.new(
      project: project,
      title: params[:title],
      script_type: params[:script_type] || 'screenplay',
      status: 'draft',
      description: params[:description],
      created_by_user_id: user.id
    )

    unless script.save
      raise ScriptUploadError::ValidationError.new(
        "Script validation failed",
        script.errors.full_messages
      )
    end

    attach_file_to_version(script)
    script.reload
  end

  def attach_file_to_version(script)
    initial_version = script.script_versions.find_by(version_number: 1)
    unless initial_version
      raise ScriptUploadError::AttachmentError, "Initial script version not found"
    end

    unless uploaded_file
      raise ScriptUploadError::FileValidationError, "File is required"
    end

    # Extract file details
    file_io, filename, content_type = extract_file_details

    unless file_io
      raise ScriptUploadError::FileValidationError, "Invalid file object: #{uploaded_file.class}"
    end

    # Attach file to version
    initial_version.file.attach(
      io: file_io,
      filename: filename,
      content_type: content_type || 'application/octet-stream'
    )

    # Update version notes
    notes = params[:notes] || "Uploaded file: #{filename}"
    initial_version.update!(notes: notes)
  rescue ActiveStorage::FileNotFoundError, ActiveStorage::IntegrityError => e
    raise ScriptUploadError::AttachmentError, "Failed to attach file: #{e.message}"
  end

  def extract_file_details
    if uploaded_file.is_a?(Hash)
      [
        uploaded_file[:tempfile],
        uploaded_file[:filename] || "uploaded_file",
        uploaded_file[:type] || 'application/octet-stream'
      ]
    elsif uploaded_file.respond_to?(:tempfile)
      [
        uploaded_file.tempfile,
        uploaded_file.respond_to?(:original_filename) ? uploaded_file.original_filename : uploaded_file.filename,
        uploaded_file.respond_to?(:content_type) ? uploaded_file.content_type : 'application/octet-stream'
      ]
    elsif uploaded_file.respond_to?(:read)
      [
        uploaded_file,
        uploaded_file.respond_to?(:filename) ? uploaded_file.filename : "uploaded_file",
        uploaded_file.respond_to?(:content_type) ? uploaded_file.content_type : 'application/octet-stream'
      ]
    else
      [nil, nil, nil]
    end
  end

  def uploaded_file
    @uploaded_file ||= params[:file]
  end
end
