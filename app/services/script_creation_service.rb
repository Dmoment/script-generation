# frozen_string_literal: true

class ScriptCreationService
  attr_reader :project, :user, :params

  def initialize(project:, user:, params:)
    @project = project
    @user = user
    @params = params
  end

  def call
    ActiveRecord::Base.transaction do
      script = build_script
      save_script(script)
      initial_version = create_initial_version(script)
      create_initial_scene(initial_version)
      script.reload
    end
  rescue StandardError => e
    Rails.logger.error "ScriptCreationService failed: #{e.message}"
    Rails.logger.error e.backtrace.join("\n")
    raise
  end

  private

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

    raise ActiveRecord::RecordInvalid, script
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
      raise ActiveRecord::RecordInvalid, scene
    end

    Rails.logger.info "Created initial scene #{scene.id} for version #{version.id}"
    scene
  end
end
