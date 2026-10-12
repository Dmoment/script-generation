# frozen_string_literal: true

require "csv"

module Screenplay
  # Production breakdown for a version: which cast, props, costumes, etc.
  # each scene needs. Cast comes from the script itself (character cues);
  # every other category is what the team tagged in scene metadata
  # (metadata["breakdown"][category] => [items]).
  class Breakdown
    CATEGORIES = %w[cast extras props costumes makeup vehicles stunts sfx music locations].freeze
    LABELS = {
      "cast" => "Cast", "extras" => "Extras", "props" => "Props", "costumes" => "Costumes",
      "makeup" => "Makeup & hair", "vehicles" => "Vehicles", "stunts" => "Stunts",
      "sfx" => "SPFX / VFX", "music" => "Music", "locations" => "Locations"
    }.freeze

    def initialize(script_version)
      @version = script_version
    end

    # { category => { item => [scene_number, ...] } } plus per-scene rows.
    def call
      by_category = CATEGORIES.index_with { {} }
      scenes = @version.scenes.ordered.map do |scene|
        tagged = (scene.metadata || {})["breakdown"] || {}
        items = CATEGORIES.index_with { |c| Array(tagged[c]).map { |i| i.to_s.strip }.reject(&:empty?).uniq }
        items["cast"] = (scene.character_names + items["cast"]).uniq
        items["locations"] = (scene.locations + items["locations"]).uniq

        items.each { |category, list| list.each { |item| (by_category[category][item] ||= []) << scene.scene_number } }

        { scene_id: scene.id, scene_number: scene.scene_number, slugline: scene.slugline, items: items }
      end

      {
        version_id: @version.id,
        categories: CATEGORIES.map { |c| { key: c, label: LABELS[c], items: by_category[c].map { |item, nums| { name: item, scene_numbers: nums } }.sort_by { |h| h[:name].downcase } } },
        scenes: scenes
      }
    end

    def to_csv
      data = call
      CSV.generate do |csv|
        csv << [ "Category", "Item", "Scenes", "Scene count" ]
        data[:categories].each do |category|
          category[:items].each do |item|
            csv << [ category[:label], item[:name], item[:scene_numbers].join(" "), item[:scene_numbers].size ]
          end
        end
      end
    end
  end
end
