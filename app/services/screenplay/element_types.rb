# frozen_string_literal: true

module Screenplay
  # Defines all valid screenplay element types and their formatting rules
  module ElementTypes
    TYPES = %w[
      slugline
      action
      character
      dialogue
      parenthetical
      transition
      centered
      page_break
    ].freeze

    # Elements that should be uppercase
    UPPERCASE_TYPES = %w[slugline character transition].freeze

    # Valid character extensions
    CHARACTER_EXTENSIONS = %w[V.O. O.S. O.C. CONT'D PRELAP].freeze

    # Valid time of day values for sluglines
    TIMES_OF_DAY = %w[
      DAY
      NIGHT
      DAWN
      DUSK
      SUNSET
      SUNRISE
      MORNING
      AFTERNOON
      EVENING
      CONTINUOUS
      LATER
      SAME
      MOMENTS\ LATER
    ].freeze

    # Common transitions
    TRANSITIONS = [
      "CUT TO:",
      "FADE IN:",
      "FADE OUT.",
      "FADE TO BLACK.",
      "DISSOLVE TO:",
      "SMASH CUT TO:",
      "MATCH CUT TO:",
      "JUMP CUT TO:",
      "TIME CUT:",
      "INTERCUT:"
    ].freeze

    def self.valid_type?(type)
      TYPES.include?(type.to_s)
    end

    def self.uppercase_type?(type)
      UPPERCASE_TYPES.include?(type.to_s)
    end
  end
end
