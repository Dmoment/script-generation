# frozen_string_literal: true

module Screenplay
  # Parses plain text or Fountain format into structured screenplay elements
  class Parser
    # Regex patterns for element detection
    SLUGLINE_PATTERN = /\A\s*(INT\.|EXT\.|INT\.\/EXT\.|I\/E\.)\s+/i.freeze
    CHARACTER_PATTERN = /\A\s*([A-Z][A-Z\s\-'\.]+)(\s*\([^)]+\))?\s*\z/.freeze
    PARENTHETICAL_PATTERN = /\A\s*\([^)]+\)\s*\z/.freeze
    TRANSITION_PATTERN = /\A\s*(CUT TO|FADE|DISSOLVE|SMASH CUT|MATCH CUT|JUMP CUT|TIME CUT|INTERCUT)/i.freeze

    # Common character name patterns (case-insensitive for detection)
    LOOKS_LIKE_NAME_PATTERN = /\A[a-zA-Z][a-zA-Z\s\-'\.]*\z/.freeze

    # Parse plain text content into elements array
    # Uses look-ahead to detect character/dialogue patterns
    def parse(content)
      return [] if content.blank?

      lines = content.split("\n").map(&:rstrip)
      elements = []
      i = 0

      while i < lines.length
        line = lines[i]
        next_line = lines[i + 1]

        if line.strip.empty?
          i += 1
          next
        end

        element = detect_element_with_lookahead(line, next_line, elements.last)

        if element
          elements << element
        end

        i += 1
      end

      elements
    end

    private

    def detect_element_with_lookahead(line, next_line, previous_element)
      stripped = line.strip
      return nil if stripped.empty?

      previous_type = previous_element&.dig("type")

      # Check for forced elements (Fountain syntax)
      forced = detect_forced_element(stripped)
      return forced if forced

      # 1. Slugline detection (INT./EXT.)
      if slugline?(stripped)
        return { "type" => "slugline", "text" => stripped.upcase }
      end

      # 2. Transition detection (CUT TO, FADE, etc.)
      if transition?(stripped)
        # "CUT TO:" style transitions end with a colon; "FADE OUT." style end with a period.
        return { "type" => "transition", "text" => stripped.upcase + (stripped.end_with?(":", ".") ? "" : ":") }
      end

      # 3. Parenthetical detection
      if parenthetical?(stripped)
        return { "type" => "parenthetical", "text" => stripped.downcase }
      end

      # 4. After character → dialogue
      if previous_type == "character"
        return { "type" => "dialogue", "text" => stripped }
      end

      # 5. After parenthetical → dialogue
      if previous_type == "parenthetical"
        return { "type" => "dialogue", "text" => stripped }
      end

      # 6. Character detection with look-ahead
      # A line is likely a character name if:
      # - It's short (1-3 words, under 30 chars)
      # - The NEXT line exists and looks like dialogue (longer text)
      # - It doesn't look like a sentence (no periods, not starting with articles)
      if looks_like_character_name?(stripped, next_line)
        return parse_character(stripped)
      end

      # 7. Default: action
      { "type" => "action", "text" => stripped }
    end

    def detect_forced_element(line)
      case line
      when /\A\.\s*(.+)/ # .SLUGLINE forces scene heading
        { "type" => "slugline", "text" => $1.upcase }
      when /\A!\s*(.+)/ # !ACTION forces action
        { "type" => "action", "text" => $1 }
      when /\A@\s*(.+)/ # @CHARACTER forces character
        parse_character($1)
      when /\A>\s*(.+?)\s*<\z/ # >TEXT< forces centered
        { "type" => "centered", "text" => $1 }
      when /\A>\s*(.+)/ # > forces transition
        { "type" => "transition", "text" => $1.upcase }
      when /\A~\s*(.+)/ # ~ forces lyrics
        { "type" => "centered", "text" => $1 }
      when /\A===\s*\z/ # Page break
        { "type" => "page_break", "text" => "" }
      else
        nil
      end
    end

    def slugline?(text)
      text.match?(SLUGLINE_PATTERN)
    end

    def transition?(text)
      upper = text.upcase
      upper.match?(TRANSITION_PATTERN) ||
        (text == text.upcase && text.strip.end_with?(":") && text.length < 30)
    end

    def parenthetical?(text)
      text.match?(PARENTHETICAL_PATTERN)
    end

    def looks_like_character_name?(text, next_line)
      # Judge the name without trailing extensions such as (V.O.), (O.S.), (CONT'D)
      text = text.sub(/(\s*\([^)]*\))+\s*\z/, "").strip
      return false if text.empty?

      # Must be short
      return false if text.length > 35

      # Must be 1-3 words
      words = text.split(/\s+/)
      return false if words.length > 3

      # Must not contain sentence-ending punctuation.
      # Periods are allowed only in all-caps abbreviated names: "MRS. FONSECA", "DR. WHO", "J.R."
      return false if text.include?(".") && !text.match?(/\A(?:[A-Z][A-Z'\-]*\.?\s*)+\z/)
      return false if text.include?(",")
      return false if text.include?("!")
      return false if text.include?("?")

      # Must not start with articles or common sentence starters
      first_word = words.first&.downcase
      return false if %w[the a an is are was were he she it they we i my your].include?(first_word)

      # Must match name pattern (letters, spaces, hyphens, apostrophes)
      return false unless text.match?(LOOKS_LIKE_NAME_PATTERN)

      # LOOK-AHEAD: Next line should exist and look like dialogue
      # Dialogue is typically longer than character names
      if next_line.present?
        next_stripped = next_line.strip
        # Next line should be non-empty and either:
        # - Longer than the character name
        # - A parenthetical
        # - Actual dialogue content
        if next_stripped.present?
          return true if parenthetical?(next_stripped)
          return true if next_stripped.length > text.length
        end
      end

      # If already uppercase and short, likely a character
      text == text.upcase && text.length >= 2
    end

    def parse_character(text)
      CharacterName.parse(text)
    end
  end
end
