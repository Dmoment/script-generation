# frozen_string_literal: true

module Screenplay
  # Production scene numbering. Until a version's numbers are locked,
  # scene_number simply follows order. Once locked, each scene keeps the
  # number it had as a label (metadata["scene_label"]); inserted scenes get
  # letter suffixes after their predecessor (12, 12A, 12B, 13), and deleted
  # scenes are kept as OMITTED placeholders so later numbers never shift.
  module SceneNumbering
    LETTERS = ("A".."Z").to_a

    module_function

    def lock!(version)
      version.transaction do
        version.scenes.ordered.each do |scene|
          meta = (scene.metadata || {}).merge("scene_label" => scene.metadata&.dig("scene_label").presence || scene.scene_number.to_s)
          scene.update_columns(metadata: meta)
        end
        version.update!(scene_numbers_locked_at: Time.current)
      end
    end

    def unlock!(version)
      version.transaction do
        version.scenes.ordered.each_with_index do |scene, i|
          meta = (scene.metadata || {}).except("scene_label", "omitted")
          scene.update_columns(metadata: meta, scene_number: -(i + 1))
        end
        version.scenes.ordered.each_with_index { |scene, i| scene.update_columns(scene_number: i + 1, order: i + 1) }
        version.update!(scene_numbers_locked_at: nil)
      end
    end

    # The production number itself (12, 12A). Omission is a separate flag so
    # the number survives on the OMITTED placeholder.
    def label_for(scene)
      scene.metadata&.dig("scene_label").presence || scene.scene_number.to_s
    end

    # Label for a scene inserted directly after `previous_scene` in a locked version.
    def inserted_label(version, previous_scene)
      base = previous_scene ? label_for(previous_scene).to_s.sub(/\A(\d+)[A-Z]*\z/, '\1') : "0"
      base = "0" unless base.match?(/\A\d+\z/)
      taken = version.scenes.map { |s| label_for(s) }
      LETTERS.each do |letter|
        candidate = "#{base}#{letter}"
        return candidate unless taken.include?(candidate)
      end
      "#{base}#{LETTERS.last}#{LETTERS.first}"
    end

    # Mark a scene omitted instead of destroying it (locked versions only).
    def omit!(scene)
      meta = (scene.metadata || {}).merge("omitted" => true)
      scene.update!(metadata: meta, elements: [], content: "")
    end
  end
end
