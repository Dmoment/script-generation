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
    raise e
  rescue ActiveRecord::RecordNotFound => e
    raise ScriptUploadError::FileValidationError, "Project not found"
  rescue StandardError => e
    raise ScriptUploadError::AttachmentError, "Upload failed: #{e.message}"
  end

  private

  def validate_file_presence
    raise ScriptUploadError::FileValidationError, "File is required" unless uploaded_file.present?
  end

  def validate_file_size
    return unless uploaded_file.present?

    file_size = extract_file_size
    return unless file_size

    if file_size > MAX_FILE_SIZE
      raise ScriptUploadError::FileValidationError,
            "File size too large (max #{MAX_FILE_SIZE / 1.megabyte}MB)"
    end
  end

  def create_script_with_version
    validate_project_exists
    script = build_script
    save_script(script)
    initial_version = create_initial_version(script)
    create_initial_scene(initial_version)
    attach_file_to_version(script)
    script.reload
  end

  def validate_project_exists
    raise ScriptUploadError::FileValidationError, "Project not found" unless project.present?
  end

  def build_script
    Script.new(
      project: project,
      title: params[:title],
      script_type: params[:script_type] || 'screenplay',
      status: 'draft',
      description: params[:description],
      created_by_user_id: user.id
    )
  end

  def save_script(script)
    return if script.save

    raise ScriptUploadError::ValidationError.new(
      "Script validation failed",
      script.errors.full_messages
    )
  end

  def create_initial_version(script)
    script.script_versions.create!(
      version_number: 1,
      notes: "Initial version"
    )
  end

  def create_initial_scene(version)
    return version.scenes.find_by(scene_number: 1) if version.scenes.exists?(scene_number: 1)

    scene = version.scenes.build(
      scene_number: 1,
      slugline: "INT. LOCATION - DAY",
      content: "",
      order: 1
    )

    unless scene.save
      error_msg = "Failed to create initial scene: #{scene.errors.full_messages.join(', ')}"
      Rails.logger.error error_msg
      Rails.logger.error "Scene attributes: #{scene.attributes.inspect}"
      raise ScriptUploadError::AttachmentError, error_msg
    end

    Rails.logger.info "Created initial scene #{scene.id} for version #{version.id}"
    scene
  end

  def attach_file_to_version(script)
    initial_version = find_initial_version(script)
    validate_uploaded_file
    attach_file(initial_version)
    update_version_notes(initial_version)
  rescue ActiveStorage::FileNotFoundError, ActiveStorage::IntegrityError => e
    raise ScriptUploadError::AttachmentError, "Failed to attach file: #{e.message}"
  end

  def find_initial_version(script)
    version = script.script_versions.find_by(version_number: 1)
    raise ScriptUploadError::AttachmentError, "Initial script version not found" unless version
    version
  end

  def validate_uploaded_file
    raise ScriptUploadError::FileValidationError, "File is required" unless uploaded_file.present?
    unless uploaded_file.is_a?(ActionDispatch::Http::UploadedFile)
      raise ScriptUploadError::FileValidationError, "Invalid file object: #{uploaded_file.class}"
    end
  end

  def attach_file(version)
    version.file.attach(uploaded_file)
  end

  def update_version_notes(version)
    filename = uploaded_file.original_filename || uploaded_file.filename
    notes = params[:notes] || "Uploaded file: #{filename}"
    version.update!(notes: notes)
  end

  def extract_file_size
    if uploaded_file.is_a?(ActionDispatch::Http::UploadedFile)
      uploaded_file.size
    elsif uploaded_file.is_a?(Hash) && uploaded_file[:tempfile].respond_to?(:size)
      uploaded_file[:tempfile].size
    elsif uploaded_file.respond_to?(:size)
      uploaded_file.size
    end
  end

  def uploaded_file
    @uploaded_file ||= params[:file]
  end
end
