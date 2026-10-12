# frozen_string_literal: true

module Screenplay
  # Picks the right exporter for a requested format.
  module Exporter
    FORMATS = {
      "fdx" => Fdx::Exporter,
      "fountain" => Fountain::Exporter
    }.freeze

    def self.for(format)
      FORMATS.fetch(format.to_s.downcase) { raise ArgumentError, "Unknown export format: #{format}" }
    end

    def self.filename(script_version, format)
      base = script_version.script.title.to_s.parameterize.presence || "script"
      "#{base}-v#{script_version.version_number}.#{self.for(format)::EXTENSION}"
    end
  end
end
