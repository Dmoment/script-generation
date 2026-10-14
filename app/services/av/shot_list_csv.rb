# frozen_string_literal: true

require "csv"

module Av
  # Shot list for the production team: one line per row, ready for a
  # spreadsheet or a scheduling tool.
  class ShotListCsv
    HEADERS = ["#", "Shot", "Video", "Audio", "Super", "Duration (s)", "Notes"].freeze

    def initialize(version)
      @version = version
    end

    def call
      CSV.generate do |csv|
        csv << HEADERS
        @version.av_rows.ordered.each do |row|
          csv << [row.position, row.shot, row.video, row.audio, row.super_text, row.duration_seconds, row.notes]
        end
        csv << []
        csv << [nil, nil, nil, nil, "Total", @version.av_rows.sum(:duration_seconds), nil]
      end
    end
  end
end
