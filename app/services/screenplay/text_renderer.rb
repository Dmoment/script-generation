# frozen_string_literal: true

module Screenplay
  # Renders structured elements back into the plain-text form the editor and
  # the Parser both understand. Dialogue blocks stay contiguous; every other
  # element is its own paragraph separated by a blank line.
  #
  #   Screenplay::TextRenderer.render(elements) #=> String
  class TextRenderer
    DIALOGUE_BLOCK = %w[parenthetical dialogue].freeze

    def self.render(elements)
      new(elements).render
    end

    def initialize(elements)
      @elements = Array(elements)
    end

    def render
      lines = []
      previous_type = nil

      @elements.each do |element|
        type = element["type"].to_s
        text = element["text"].to_s.strip
        next if text.empty? && type != "page_break"

        contiguous = DIALOGUE_BLOCK.include?(type) && %w[character parenthetical dialogue].include?(previous_type)
        lines << "" unless lines.empty? || contiguous

        lines << case type
        when "character" then CharacterName.render(element)
        when "centered" then "> #{text} <"
        when "page_break" then "==="
        else text
        end

        previous_type = type
      end

      lines.join("\n")
    end
  end
end
