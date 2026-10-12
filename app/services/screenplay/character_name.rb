# frozen_string_literal: true

module Screenplay
  # Splits a character cue such as "BABA (V.O.) (CONT'D)" into the name and
  # its recognised extensions. Unknown parentheticals are left on the name.
  module CharacterName
    module_function

    def parse(text)
      name = text.to_s.strip.upcase
      extensions = []

      while name =~ /\s*\(([^)]+)\)\s*\z/
        ext = Regexp.last_match(1).strip.upcase
        break unless ElementTypes::CHARACTER_EXTENSIONS.include?(ext)

        extensions.unshift(ext)
        name = name.sub(/\s*\([^)]+\)\s*\z/, "")
      end

      element = { "type" => "character", "text" => name.strip }
      element["extensions"] = extensions if extensions.any?
      element
    end

    # "BABA" + ["V.O."] => "BABA (V.O.)"
    def render(element)
      name = element["text"].to_s
      extensions = Array(element["extensions"])
      return name if extensions.empty?

      "#{name} #{extensions.map { |e| "(#{e})" }.join(' ')}"
    end
  end
end
