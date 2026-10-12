# frozen_string_literal: true

module Screenplay
  # Post-formatting service that cleans up an entire script.
  # Called ON-DEMAND by the writer, not automatically.
  #
  # This is like "Format Document" in an IDE - user explicitly requests it.
  # Can show a diff before applying so writer knows what will change.
  #
  class PostFormatter
    attr_reader :changes

    def initialize
      @soft_formatter = SoftFormatter.new
      @changes = []
    end

    # Format all scenes in a script version
    # Returns a hash with :formatted_scenes and :changes for diff display
    def format_script_version(script_version)
      @changes = []
      formatted_scenes = []

      script_version.scenes.ordered.each do |scene|
        formatted = format_scene(scene)
        formatted_scenes << formatted
      end

      {
        formatted_scenes: formatted_scenes,
        changes: @changes,
        total_changes: @changes.length
      }
    end

    # Format a single scene
    # Returns formatted scene data (doesn't save automatically)
    def format_scene(scene)
      old_elements = scene.elements || []
      new_elements = []
      previous_type = nil

      # ALWAYS parse content fresh if it exists
      # This ensures we compare current content vs. previously saved elements
      if scene.content.present?
        parser = Parser.new
        parsed_elements = parser.parse(scene.content)

        parsed_elements.each_with_index do |element, index|
          formatted = format_element_fresh(element, previous_type)
          new_elements << formatted
          previous_type = formatted["type"]
        end
      elsif old_elements.any?
        # Fall back to formatting existing elements
        old_elements.each_with_index do |element, index|
          formatted = format_element_fresh(element, previous_type)
          new_elements << formatted
          previous_type = formatted["type"]
        end
      end

      # Compare old elements vs new elements to find changes
      track_element_changes(scene.id, old_elements, new_elements)

      # Format slugline separately
      original_slugline = scene.slugline || ""
      formatted_slugline = if original_slugline.present?
        @soft_formatter.format("slugline", original_slugline)
      else
        extract_slugline(new_elements)
      end

      # Track slugline changes
      if original_slugline != formatted_slugline && (original_slugline.present? || formatted_slugline.present?)
        @changes << {
          scene_id: scene.id,
          element_index: -1,
          type: "slugline_change",
          original: { type: "slugline", text: original_slugline.presence || "(empty)" },
          formatted: { type: "slugline", text: formatted_slugline.presence || "(empty)" }
        }
      end

      {
        id: scene.id,
        scene_number: scene.scene_number,
        slugline: formatted_slugline,
        elements: new_elements,
        content: scene.content,
        original_elements: old_elements,
        original_slugline: original_slugline
      }
    end

    # Format a single element (without tracking changes - that's done separately)
    def format_element_fresh(element, previous_type)
      original_type = element["type"]
      original_text = element["text"] || ""

      # Detect type if needed (for parsed content)
      detected_type = @soft_formatter.detect_type(original_text, previous_type)
      final_type = original_type || detected_type

      # Format text based on type
      formatted_text = @soft_formatter.format(final_type, original_text)

      {
        "type" => final_type,
        "text" => formatted_text,
        "id" => element["id"] || SecureRandom.uuid,
        "extensions" => element["extensions"]
      }.compact
    end

    # Compare old elements with new elements and track changes
    def track_element_changes(scene_id, old_elements, new_elements)
      max_length = [ old_elements.length, new_elements.length ].max

      max_length.times do |i|
        old_el = old_elements[i] || {}
        new_el = new_elements[i] || {}

        old_text = old_el["text"] || ""
        new_text = new_el["text"] || ""
        old_type = old_el["type"] || ""
        new_type = new_el["type"] || ""

        # Only track if text actually changed (not just type)
        # Skip if both texts are identical
        next if old_text == new_text && old_type == new_type
        next if old_text.strip == new_text.strip && old_type == new_type

        @changes << {
          scene_id: scene_id,
          element_index: i,
          type: "element_change",
          original: {
            type: old_type.presence || "(new)",
            text: old_text.presence || "(added)"
          },
          formatted: {
            type: new_type.presence || "(removed)",
            text: new_text.presence || "(removed)"
          }
        }
      end
    end

    # Apply formatted changes to a script version (saves to DB)
    def apply_formatting!(script_version, formatted_data)
      formatted_data[:formatted_scenes].each do |formatted_scene|
        scene = script_version.scenes.find(formatted_scene[:id])

        update_attrs = { slugline: formatted_scene[:slugline] }

        # Update elements if we have formatted elements
        if formatted_scene[:elements].present? && formatted_scene[:elements].any?
          update_attrs[:elements] = formatted_scene[:elements]
          # Also regenerate content from elements so UI shows updated text
          update_attrs[:content] = elements_to_content(formatted_scene[:elements])
        end

        scene.update!(update_attrs)
      end
    end

    private

    def extract_slugline(elements)
      slugline_element = elements.find { |el| el["type"] == "slugline" }
      slugline_element&.dig("text")
    end

    # Convert elements array back to plain text content so the content
    # field stays in sync with elements.
    def elements_to_content(elements)
      TextRenderer.render(elements)
    end
  end
end
