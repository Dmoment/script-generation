# frozen_string_literal: true

module Av
  # Round-to-round comparison of AV rows. Rows are matched by lineage
  # (metadata.source_row_id written by the cloner), so a row keeps its identity
  # when rounds are reordered.
  class VersionDiff
    Result = Struct.new(:status, :base_row, :target_row, :changed_fields, keyword_init: true) do
      def to_h
        {
          status: status,
          position: (target_row || base_row).position,
          base_row_id: base_row&.id,
          target_row_id: target_row&.id,
          changed_fields: changed_fields,
          base: base_row && AvRow::FIELDS.index_with { |f| base_row.public_send(f) },
          target: target_row && AvRow::FIELDS.index_with { |f| target_row.public_send(f) }
        }
      end
    end

    def initialize(base, target)
      @base = base
      @target = target
    end

    def call
      base_rows = @base.av_rows.ordered.to_a
      target_rows = @target.av_rows.ordered.to_a
      ancestry = lineage(base_rows, target_rows)

      results = target_rows.map do |row|
        origin = ancestry[row.id]
        if origin
          changed = AvRow::FIELDS.reject { |f| normalize(origin.public_send(f)) == normalize(row.public_send(f)) }
          Result.new(status: changed.empty? ? "unchanged" : "changed", base_row: origin, target_row: row, changed_fields: changed)
        else
          Result.new(status: "added", base_row: nil, target_row: row, changed_fields: AvRow::FIELDS)
        end
      end
      matched = ancestry.values.map(&:id)
      base_rows.reject { |r| matched.include?(r.id) }.each do |row|
        results << Result.new(status: "removed", base_row: row, target_row: nil, changed_fields: AvRow::FIELDS)
      end
      results.sort_by { |r| [(r.target_row || r.base_row).position, r.status == "removed" ? 1 : 0] }
    end

    def changed_row_ids
      call.select { |r| r.status == "changed" || r.status == "added" }.filter_map { |r| r.target_row&.id }
    end

    private

    # Walk each target row back through intermediate rounds until a row of the
    # base version is reached.
    def lineage(base_rows, target_rows)
      base_ids = base_rows.index_by(&:id)
      target_rows.each_with_object({}) do |row, map|
        cursor = row
        seen = Set.new
        while cursor && !base_ids.key?(cursor.id)
          src = cursor.source_row_id
          break if src.nil? || seen.include?(src)

          seen << src
          cursor = AvRow.find_by(id: src)
        end
        map[row.id] = cursor if cursor && base_ids.key?(cursor.id)
      end
    end

    def normalize(value)
      value.is_a?(String) ? value.strip : value
    end
  end
end
