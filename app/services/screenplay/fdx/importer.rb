# frozen_string_literal: true

require "nokogiri"

module Screenplay
  module Fdx
    # Reads a Final Draft (.fdx) document into elements. Only the script body
    # is imported; the title page is exposed separately.
    class Importer
      TYPES = {
        "Scene Heading" => "slugline",
        "Action" => "action",
        "Character" => "character",
        "Parenthetical" => "parenthetical",
        "Dialogue" => "dialogue",
        "Transition" => "transition",
        "Shot" => "action",
        "General" => "action",
        "Lyrics" => "dialogue",
        "Centered" => "centered",
        "New Act" => "centered",
        "End Of Act" => "centered",
        "Teaser/Act One" => "centered",
        "Cast List" => nil,
        "Title Page" => nil
      }.freeze

      def initialize(xml)
        @doc = Nokogiri::XML(xml.to_s) { |config| config.noblanks }
      end

      def valid?
        @doc.root&.name == "FinalDraft"
      end

      def title_page
        @doc.xpath("/FinalDraft/TitlePage/Content/Paragraph").map { |p| paragraph_text(p) }.reject(&:blank?)
      end

      def elements
        raise ImportError, "Not a Final Draft document" unless valid?

        result = []
        @doc.xpath("/FinalDraft/Content/Paragraph").each do |paragraph|
          fd_type = paragraph["Type"].to_s
          next unless TYPES.key?(fd_type) ? TYPES[fd_type] : true

          type = TYPES.fetch(fd_type, "action")
          type = "centered" if type == "action" && paragraph["Alignment"] == "Center"
          text = paragraph_text(paragraph)
          next if text.empty?

          result << { "type" => "page_break", "text" => "" } if paragraph["StartsNewPage"] == "Yes" && result.any?

          element = type == "character" ? CharacterName.parse(text) : { "type" => type, "text" => text }
          element["scene_number"] = paragraph["Number"] if type == "slugline" && paragraph["Number"].present?
          result << element
        end
        result
      end

      private

      # Text runs (style changes) are separate <Text> nodes; join them as-is.
      def paragraph_text(paragraph)
        paragraph.xpath("./Text").map(&:text).join.gsub(/\s+/, " ").strip
      end
    end
  end
end
