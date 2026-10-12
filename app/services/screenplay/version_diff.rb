# frozen_string_literal: true

module Screenplay
  # Compares two versions of the same script scene by scene.
  #
  # Scenes are matched by lineage first (a cloned scene points at its source
  # through metadata["source_scene_id"]; the chain is followed across drafts),
  # then by scene number for versions without lineage (imports, old data).
  # Elements inside a matched scene are diffed with an LCS so the result reads
  # like a classic script comparison: unchanged, added and removed lines.
  class VersionDiff
    SceneResult = Struct.new(:status, :scene_number, :slugline, :base_scene_id, :target_scene_id, :changes, keyword_init: true)

    def initialize(base_version, target_version)
      @base = base_version
      @target = target_version
    end

    # Array of SceneResult in target order, followed by removed base scenes.
    def call
      base_scenes = @base.scenes.ordered.to_a
      target_scenes = @target.scenes.ordered.to_a
      base_by_id = base_scenes.index_by(&:id)
      matched_base_ids = Set.new
      results = []

      target_scenes.each do |scene|
        base_scene = lineage_match(scene, base_by_id, matched_base_ids) || number_match(scene, base_scenes, matched_base_ids)
        if base_scene
          matched_base_ids << base_scene.id
          changes = element_diff(key_elements(base_scene), key_elements(scene))
          status = changes.any? { |c| c[:op] != "same" } ? "changed" : "unchanged"
          results << SceneResult.new(status: status, scene_number: scene.scene_number, slugline: scene.slugline,
                                     base_scene_id: base_scene.id, target_scene_id: scene.id, changes: changes)
        else
          results << SceneResult.new(status: "added", scene_number: scene.scene_number, slugline: scene.slugline,
                                     base_scene_id: nil, target_scene_id: scene.id,
                                     changes: key_elements(scene).map { |el| { op: "add", element: el } })
        end
      end

      base_scenes.reject { |s| matched_base_ids.include?(s.id) }.each do |scene|
        results << SceneResult.new(status: "removed", scene_number: scene.scene_number, slugline: scene.slugline,
                                   base_scene_id: scene.id, target_scene_id: nil,
                                   changes: key_elements(scene).map { |el| { op: "del", element: el } })
      end

      results
    end

    # Ids of target scenes that differ from the base (for revision marks).
    def changed_scene_ids
      call.select { |r| %w[changed added].include?(r.status) }.map(&:target_scene_id).compact
    end

    private

    # Follow source_scene_id from the target scene back until we hit a scene of the base version.
    def lineage_match(scene, base_by_id, matched)
      source_id = scene.metadata&.dig("source_scene_id")
      seen = 0
      while source_id && seen < 20
        return base_by_id[source_id] if base_by_id.key?(source_id) && !matched.include?(source_id)

        ancestor = Scene.find_by(id: source_id)
        source_id = ancestor&.metadata&.dig("source_scene_id")
        seen += 1
      end
      nil
    end

    def number_match(scene, base_scenes, matched)
      return nil if scene.metadata&.dig("source_scene_id").present?

      base_scenes.find { |b| b.scene_number == scene.scene_number && !matched.include?(b.id) }
    end

    def key_elements(scene)
      elements = scene.elements.presence || []
      elements = [{ "type" => "slugline", "text" => scene.slugline }] + elements if scene.slugline.present? && elements.none? { |e| e["type"] == "slugline" }
      elements.map { |e| e.slice("type", "text", "extensions") }
    end

    # Longest-common-subsequence diff over elements compared by type, text and extensions.
    def element_diff(before, after)
      key = ->(el) { [el["type"], el["text"].to_s.strip, Array(el["extensions"])] }
      n = before.size
      m = after.size
      table = Array.new(n + 1) { Array.new(m + 1, 0) }
      (n - 1).downto(0) do |i|
        (m - 1).downto(0) do |j|
          table[i][j] = key.(before[i]) == key.(after[j]) ? table[i + 1][j + 1] + 1 : [table[i + 1][j], table[i][j + 1]].max
        end
      end

      ops = []
      i = j = 0
      while i < n && j < m
        if key.(before[i]) == key.(after[j])
          ops << { op: "same", element: after[j] }
          i += 1
          j += 1
        elsif table[i + 1][j] >= table[i][j + 1]
          ops << { op: "del", element: before[i] }
          i += 1
        else
          ops << { op: "add", element: after[j] }
          j += 1
        end
      end
      ops.concat(before[i..].to_a.map { |el| { op: "del", element: el } })
      ops.concat(after[j..].to_a.map { |el| { op: "add", element: el } })
      ops
    end
  end
end
