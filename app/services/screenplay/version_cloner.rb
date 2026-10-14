# frozen_string_literal: true

module Screenplay
  # Creates the next draft of a script by copying every scene of a source
  # version. Each copy remembers the scene it came from
  # (metadata["source_scene_id"]) so later drafts can be compared by lineage
  # even after scenes are reordered or renumbered.
  class VersionCloner
    def initialize(script, source_version: nil, notes: nil)
      @script = script
      @source = source_version || script.latest_version
      @notes = notes
    end

    def call
      ActiveRecord::Base.transaction do
        version = @script.script_versions.create!(
          notes: @notes.presence || "Draft from v#{@source&.version_number}",
          scene_numbers_locked_at: @source&.numbers_locked? ? Time.current : nil,
          revision_color: @source&.numbers_locked? ? RevisionColors.next_after(@source.revision_color) : nil,
          revision_date: @source&.numbers_locked? ? Date.current : nil
        )
        @source&.av_rows&.ordered&.each do |row|
          version.av_rows.create!(
            position: row.position, shot: row.shot, video: row.video, audio: row.audio,
            super_text: row.super_text, duration_seconds: row.duration_seconds, notes: row.notes,
            metadata: (row.metadata || {}).merge("source_row_id" => row.id)
          )
        end
        @source&.scenes&.ordered&.each do |scene|
          version.scenes.create!(
            scene_number: scene.scene_number,
            order: scene.order,
            slugline: scene.slugline,
            elements: scene.elements,
            content: scene.content,
            metadata: (scene.metadata || {}).merge("source_scene_id" => scene.id)
          )
        end
        version
      end
    end
  end
end
