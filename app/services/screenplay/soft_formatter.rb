# frozen_string_literal: true

module Screenplay
  # Soft real-time formatting that assists writers without interrupting.
  # These are INVISIBLE, EXPECTED transformations that feel like typing assistance.
  #
  # Philosophy:
  # - Never block or warn
  # - Never change creative intent
  # - Only apply transformations that writers EXPECT
  # - Feel like autocomplete, not autocorrect
  #
  class SoftFormatter
    # Slugline patterns for detection
    SLUGLINE_STARTS = /\A(int\.?|ext\.?|int\.?\/ext\.?|i\/e\.?)\s+/i.freeze

    # Apply soft formatting to text based on element type
    # Returns formatted text - never raises, never warns
    def format(type, text)
      return "" if text.nil?
      return text if text.strip.empty?

      case type.to_s
      when "slugline"
        soft_format_slugline(text)
      when "character"
        soft_format_character(text)
      when "transition"
        soft_format_transition(text)
      when "parenthetical"
        soft_format_parenthetical(text)
      else
        # dialogue, action, centered - preserve as-is
        text
      end
    end

    # Detect element type from text and context
    # Returns best guess - never forces, writer can override
    def detect_type(text, previous_type = nil)
      return "action" if text.nil? || text.strip.empty?

      trimmed = text.strip

      # 1. Slugline detection (starts with INT./EXT.)
      return "slugline" if slugline?(trimmed)

      # 2. Transition detection (CUT TO, FADE, etc.)
      return "transition" if transition?(trimmed)

      # 3. Parenthetical detection (wrapped in parens)
      return "parenthetical" if parenthetical?(trimmed)

      # 4. After character → dialogue
      return "dialogue" if previous_type == "character"

      # 5. After parenthetical → dialogue (continuing)
      return "dialogue" if previous_type == "parenthetical"

      # 6. Character detection (short, looks like a name)
      return "character" if looks_like_character?(trimmed, previous_type)

      # Default: action
      "action"
    end

    # Get the next logical element type after pressing Enter
    def next_type_after(current_type)
      case current_type.to_s
      when "slugline"
        "action"
      when "action"
        "action"  # Could be character, but let detection decide
      when "character"
        "dialogue"
      when "dialogue"
        "action"  # Back to action, detection will find character if typed
      when "parenthetical"
        "dialogue"
      when "transition"
        "slugline"
      else
        "action"
      end
    end

    private

    # Soft format slugline: uppercase, add punctuation
    # "int beach day" → "INT. BEACH - DAY"
    def soft_format_slugline(text)
      result = text.strip.upcase

      # Normalize INT/EXT prefix with period
      result = result
        .gsub(/\AINT\s*\/\s*EXT\s*\.?\s*/i, "INT./EXT. ")
        .gsub(/\AI\s*\/\s*E\s*\.?\s*/i, "INT./EXT. ")
        .gsub(/\AINT\s*\.?\s*(?!\/)/i, "INT. ")
        .gsub(/\AEXT\s*\.?\s*/i, "EXT. ")

      # Normalize dash/hyphen (but only if there's content after location)
      # Don't add dash if writer hasn't typed time yet
      if result.include?(" - ") || result.include?(" – ") || result.include?(" — ")
        result = result.gsub(/\s*[-–—]\s*/, " - ")
      end

      result
    end

    # Soft format character: uppercase only
    # "barry" → "BARRY"
    def soft_format_character(text)
      # Remove any trailing extensions for the name itself
      # Extensions should be in separate field
      text.strip.upcase
    end

    # Soft format transition: uppercase, ensure ends with colon
    # "cut to" → "CUT TO:"
    def soft_format_transition(text)
      result = text.strip.upcase
      result += ":" unless result.end_with?(":") || result.end_with?(".")
      result
    end

    # Soft format parenthetical: lowercase, ensure parens
    # "beat" → "(beat)"
    def soft_format_parenthetical(text)
      result = text.strip.downcase
      result = "(#{result}" unless result.start_with?("(")
      result = "#{result})" unless result.end_with?(")")
      result
    end

    # Detection helpers

    def slugline?(text)
      text.match?(SLUGLINE_STARTS)
    end

    def transition?(text)
      text.match?(/\A(CUT TO|FADE|DISSOLVE|SMASH CUT|MATCH CUT|JUMP CUT|TIME CUT|INTERCUT)/i) ||
        (text == text.upcase && text.strip.end_with?(":") && text.length < 25)
    end

    def parenthetical?(text)
      text.match?(/\A\([^)]+\)\z/)
    end

    def looks_like_character?(text, previous_type)
      return false if previous_type == "character"  # Can't have two characters in row
      return false if text.length > 40  # Too long for a name
      return false if text.include?(".")  # Likely a sentence
      return false if text.split(" ").length > 4  # Too many words

      # If already uppercase and short, likely a character
      text == text.upcase && text.length >= 2
    end
  end
end
