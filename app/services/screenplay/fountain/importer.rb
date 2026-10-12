# frozen_string_literal: true

module Screenplay
  module Fountain
    # Reads a Fountain (or plain text) document into elements plus title-page
    # metadata. Sections, synopses, notes and boneyard are stripped.
    class Importer
      TITLE_KEY = /\A([A-Za-z][A-Za-z ]*):\s*(.*)\z/

      def initialize(text)
        @text = text.to_s.encode("UTF-8", invalid: :replace, undef: :replace).delete("\r")
        @title_page = {}
        @body = strip_title_page(@text)
      end

      # Title-page key/values ("title", "author", "draft_date", ...)
      attr_reader :title_page

      def elements
        body = strip_boneyard_and_notes(@body)
        body = strip_sections_and_synopses(body)
        body = body.gsub(/\s*\^\s*$/, "") # dual dialogue marker

        Parser.new.parse(body)
      end

      private

      def strip_title_page(text)
        head, _sep, rest = text.partition(/\n\s*\n/)
        return text unless head.lines.first.to_s.chomp.match?(TITLE_KEY)

        key = nil
        head.each_line do |raw|
          line = raw.chomp
          if (m = line.match(TITLE_KEY))
            key = m[1].strip.downcase.tr(" ", "_")
            @title_page[key] = m[2].strip
          elsif key && line.start_with?(" ", "\t")
            @title_page[key] = [@title_page[key], line.strip].reject(&:blank?).join("\n")
          end
        end
        rest
      end

      def strip_boneyard_and_notes(text)
        text.gsub(%r{/\*.*?\*/}m, "").gsub(/\[\[.*?\]\]/m, "")
      end

      def strip_sections_and_synopses(text)
        text.lines.reject { |line| line.match?(/\A\s*(#|=(?!==))/) }.join
      end
    end
  end
end
