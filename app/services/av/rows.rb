# frozen_string_literal: true

module Av
  # Row bookkeeping for a two-column script: insertion, deletion and reorder
  # keep positions dense (1..n) so the displayed row number is always the
  # position.
  class Rows
    STARTER_ROWS = [
      { shot: "WS", video: "Open on…", audio: "MUSIC: " },
      { shot: "MS", video: "", audio: "VO: " },
      { shot: "CU", video: "Product / logo", audio: "SUPER + VO tagline" }
    ].freeze

    def initialize(version)
      @version = version
    end

    def insert(after_row_id: nil, **attrs)
      ActiveRecord::Base.transaction do
        after = after_row_id ? @version.av_rows.find(after_row_id) : nil
        position = after ? after.position + 1 : (@version.av_rows.maximum(:position) || 0) + 1
        @version.av_rows.where("position >= ?", position).update_all("position = position + 1") if after
        @version.av_rows.create!(attrs.merge(position: position))
      end
    end

    def destroy(row)
      ActiveRecord::Base.transaction do
        row.destroy!
        renumber!
      end
    end

    def reorder(row_ids)
      ActiveRecord::Base.transaction do
        rows = @version.av_rows.ordered.to_a
        raise ArgumentError, "every row of the version must be listed exactly once" unless row_ids.sort == rows.map(&:id).sort

        by_id = rows.index_by(&:id)
        row_ids.each_with_index { |id, i| by_id[id].update_columns(position: i + 1, updated_at: Time.current) }
      end
      @version.av_rows.ordered
    end

    def renumber!
      @version.av_rows.ordered.each_with_index do |row, i|
        row.update_columns(position: i + 1) if row.position != i + 1
      end
    end

    def seed_starter_rows!
      return if @version.av_rows.exists?

      STARTER_ROWS.each_with_index { |attrs, i| @version.av_rows.create!(attrs.merge(position: i + 1)) }
    end

    def total_seconds
      @version.av_rows.sum(:duration_seconds)
    end
  end
end
