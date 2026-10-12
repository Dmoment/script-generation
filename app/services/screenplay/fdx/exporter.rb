# frozen_string_literal: true

require "nokogiri"

module Screenplay
  module Fdx
    # Writes a script version as a Final Draft (.fdx) document.
    class Exporter
      MIME_TYPE = "application/xml; charset=utf-8"
      EXTENSION = "fdx"

      PARAGRAPH_TYPES = {
        "slugline" => "Scene Heading",
        "action" => "Action",
        "character" => "Character",
        "parenthetical" => "Parenthetical",
        "dialogue" => "Dialogue",
        "transition" => "Transition",
        "centered" => "General"
      }.freeze

      def initialize(script_version)
        @version = script_version
        @script = script_version.script
      end

      def export
        builder = Nokogiri::XML::Builder.new(encoding: "UTF-8") do |xml|
          xml.FinalDraft(DocumentType: "Script", Template: "No", Version: "5") do
            xml.Content { write_content(xml) }
            xml.TitlePage { xml.Content { write_title_page(xml) } }
          end
        end
        builder.to_xml
      end

      private

      def write_content(xml)
        starts_new_page = false
        @version.scenes.ordered.each do |scene|
          elements = scene.elements.presence || []
          if scene.slugline.present? && elements.none? { |e| e["type"] == "slugline" }
            elements = [ { "type" => "slugline", "text" => scene.slugline } ] + elements
          end

          elements.each do |element|
            type = element["type"].to_s
            if type == "page_break"
              starts_new_page = true
              next
            end

            text = type == "character" ? CharacterName.render(element) : element["text"].to_s
            next if text.strip.empty?

            attrs = { Type: PARAGRAPH_TYPES.fetch(type, "Action") }
            attrs[:Alignment] = "Center" if type == "centered"
            attrs[:StartsNewPage] = "Yes" if starts_new_page
            attrs[:Number] = scene.scene_number.to_s if type == "slugline"
            starts_new_page = false

            xml.Paragraph(attrs) do
              xml.SceneProperties(Length: "", Page: "", Title: "") if type == "slugline"
              xml.Text text
            end
          end
        end
      end

      def write_title_page(xml)
        xml.Paragraph(Alignment: "Center") { xml.Text @script.title.to_s.upcase }
        author = @script.created_by_user&.name
        if author.present?
          xml.Paragraph(Alignment: "Center") { xml.Text "" }
          xml.Paragraph(Alignment: "Center") { xml.Text "Written by" }
          xml.Paragraph(Alignment: "Center") { xml.Text author }
        end
      end
    end
  end
end
