# frozen_string_literal: true

module Screenplay
  # Groups a flat list of elements into scenes. A new scene starts at every
  # slugline; anything before the first slugline becomes an opening scene
  # without a heading (FADE IN:, a cold-open action line, etc.).
  class SceneSplitter
    Chunk = Struct.new(:slugline, :elements, :original_number, keyword_init: true)

    def self.split(elements)
      new(elements).split
    end

    def initialize(elements)
      @elements = Array(elements)
    end

    def split
      chunks = []
      current = nil

      @elements.each do |element|
        if element["type"] == "slugline"
          current = Chunk.new(slugline: element["text"], elements: [], original_number: element["scene_number"])
          chunks << current
          current.elements << element.except("scene_number")
        else
          if current.nil?
            current = Chunk.new(slugline: nil, elements: [], original_number: nil)
            chunks << current
          end
          current.elements << element
        end
      end

      chunks.reject { |c| c.elements.all? { |e| e["text"].to_s.strip.empty? && e["type"] != "page_break" } }
    end
  end
end
