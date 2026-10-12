# frozen_string_literal: true

class Scene < ApplicationRecord
  belongs_to :script_version

  self.whitelisted_ransackable_attributes = %w[
    scene_number
    slugline
    script_version_id
    order
  ]

  # Only structural validations - NEVER block on formatting
  validates :scene_number, presence: true, uniqueness: { scope: :script_version_id }
  validates :scene_number, numericality: { greater_than: 0 }
  validates :order, presence: true, numericality: { greater_than_or_equal_to: 0 }
  # NO validate_elements_format - we never block writers

  scope :ordered, -> { order(:order, :scene_number) }
  scope :by_version, ->(version_id) { where(script_version_id: version_id) }

  before_validation :set_default_order, on: :create, if: -> { order.nil? || order.zero? }
  # Keep the two representations in step: the editor saves `elements`, legacy
  # callers and imports may save `content`. Whichever changed wins.
  before_save :sync_content_and_elements
  before_save :sync_slugline_from_elements, if: :elements_changed?

  # Extract all unique character names from this scene's elements
  def character_names
    return [] unless elements.is_a?(Array)

    elements
      .select { |el| el["type"] == "character" }
      .map { |el| el["text"] }
      .uniq
  end

  # Extract all locations referenced in this scene
  def locations
    return [] unless slugline.present?

    # Parse location from slugline (everything between INT./EXT. and the dash)
    match = slugline.match(/\A(?:INT\.|EXT\.|INT\.\/EXT\.)\s+(.+?)\s*[-–—]/)
    match ? [ match[1].strip ] : []
  end

  # Convert elements to plain text (for search/export)
  def elements_as_text
    return content.to_s if elements.blank?

    Screenplay::TextRenderer.render(elements)
  end

  def parse_content_to_elements!
    return if content.blank?

    parser = Screenplay::Parser.new
    self.elements = parser.parse(content)
  end

  # Apply soft formatting to all elements (called on-demand, not automatically)
  def apply_soft_formatting!
    return unless elements.is_a?(Array)

    formatter = Screenplay::SoftFormatter.new
    previous_type = nil

    self.elements = elements.map do |el|
      formatted_text = formatter.format(el["type"], el["text"])
      previous_type = el["type"]

      el.merge("text" => formatted_text)
    end
  end

  private

  def set_default_order
    return if order.present? && order.positive?

    max_order = script_version.scenes.maximum(:order) || 0
    self.order = max_order + 1
  end

  def sync_content_and_elements
    sync_elements_from_slugline if will_save_change_to_slugline? && !will_save_change_to_elements? && slugline.present?

    if will_save_change_to_elements? && !will_save_change_to_content?
      self.content = elements_as_text
    elsif will_save_change_to_content? && !will_save_change_to_elements?
      self.elements = content.present? ? Screenplay::Parser.new.parse(content) : []
    end
  end

  # A heading edited on its own (scene header, API) is written into the first
  # heading element so the structured form never shows a stale slugline.
  def sync_elements_from_slugline
    els = elements.is_a?(Array) ? elements.map(&:dup) : []
    index = els.index { |el| el["type"] == "slugline" }
    if index
      els[index] = els[index].merge("text" => slugline)
    else
      els.unshift("type" => "slugline", "text" => slugline)
    end
    self.elements = els
  end

  # Only adopt a heading from the elements when there is one; never blank an
  # existing slugline because a body was saved without its heading.
  def sync_slugline_from_elements
    return unless elements.is_a?(Array)

    slugline_element = elements.find { |el| el["type"] == "slugline" }
    self.slugline = slugline_element["text"] if slugline_element && slugline_element["text"].present?
  end
end
