# frozen_string_literal: true

module Screenplay
  module Fountain
    # Writes a script version as a Fountain document (https://fountain.io).
    class Exporter
      MIME_TYPE = "text/plain; charset=utf-8"
      EXTENSION = "fountain"

      def initialize(script_version)
        @version = script_version
        @script = script_version.script
      end

      def export
        [title_page, body].reject(&:blank?).join("\n\n") + "\n"
      end

      private

      def title_page
        lines = ["Title: #{@script.title}"]
        author = @script.created_by_user&.name
        lines << "Credit: Written by" if author.present?
        lines << "Author: #{author}" if author.present?
        lines << "Draft date: #{@version.updated_at.to_date.iso8601}"
        lines << "Notes: #{@version.notes.to_s.gsub(/\s+/, ' ')}" if @version.notes.present?
        lines.join("\n")
      end

      def body
        @version.scenes.ordered.map { |scene| render_scene(scene) }.reject(&:blank?).join("\n\n")
      end

      def render_scene(scene)
        elements = scene.elements.presence || []
        elements = [{ "type" => "slugline", "text" => scene.slugline }] + elements if scene.slugline.present? && elements.none? { |e| e["type"] == "slugline" }

        elements.map { |element| render_element(element) }.compact.join("\n")
      end

      # Fountain needs a blank line between paragraphs but keeps dialogue
      # blocks contiguous, which is exactly what TextRenderer produces. Force
      # markers are added where Fountain's own detection would disagree.
      def render_element(element)
        type = element["type"].to_s
        text = element["text"].to_s.strip
        return nil if text.empty? && type != "page_break"

        rendered = case type
                   when "slugline" then text.match?(Parser::SLUGLINE_PATTERN) ? text : ".#{text}"
                   when "transition" then text.end_with?("TO:") ? text : ">#{text}"
                   when "character" then force_character(CharacterName.render(element))
                   when "centered" then "> #{text} <"
                   when "page_break" then "==="
                   when "action" then force_action(text)
                   else text
                   end

        # Blank line before every paragraph except the ones inside a dialogue block.
        contiguous = %w[parenthetical dialogue].include?(type)
        contiguous ? rendered : "\n#{rendered}"
      end

      # A lowercase or mixed-case character name needs the @ force marker.
      def force_character(text)
        text == text.upcase ? text : "@#{text}"
      end

      # An all-caps action line (e.g. "SILENCE.") would be read as a cue.
      def force_action(text)
        text == text.upcase && text.length < 40 && !text.include?(".") ? "!#{text}" : text
      end
    end
  end
end
