# frozen_string_literal: true

module Screenplay
  # Industry revision colour sequence. The first locked draft is White;
  # every draft after it takes the next colour (then starts over as
  # "Double White" etc.).
  module RevisionColors
    SEQUENCE = %w[white blue pink yellow green goldenrod buff salmon cherry].freeze

    HEX = {
      "white" => "#FFFFFF", "blue" => "#BFD7F2", "pink" => "#F9C9D8", "yellow" => "#FBEFA8",
      "green" => "#C9EBC9", "goldenrod" => "#F0CF7A", "buff" => "#F4E1C1", "salmon" => "#F8C4B4", "cherry" => "#F2A6A6"
    }.freeze

    module_function

    def next_after(color)
      return SEQUENCE.first if color.blank?

      base = color.to_s.sub(/\Adouble /, "")
      index = SEQUENCE.index(base)
      return SEQUENCE.first unless index

      if index == SEQUENCE.size - 1
        "double white"
      else
        prefix = color.to_s.start_with?("double ") ? "double " : ""
        "#{prefix}#{SEQUENCE[index + 1]}"
      end
    end

    def label(color)
      color.to_s.split.map(&:capitalize).join(" ")
    end

    def hex(color)
      HEX.fetch(color.to_s.sub(/\Adouble /, ""), "#FFFFFF")
    end
  end
end
