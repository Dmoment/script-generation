# frozen_string_literal: true

module Screenplay
  # Replaces the scenes of a script version with the contents of an uploaded
  # screenplay file (Final Draft .fdx, Fountain .fountain, or plain .txt).
  #
  #   Screenplay::ScriptImporter.new(version, file: uploaded_file).call
  #   Screenplay::ScriptImporter.new(version, content: text, filename: "x.fdx").call
  #
  # Returns a result struct with scene and element counts.
  class ScriptImporter
    Result = Struct.new(:format, :scenes_count, :elements_count, :title_page, keyword_init: true)

    IMPORTABLE_EXTENSIONS = %w[fdx fountain txt].freeze

    def self.importable?(filename)
      IMPORTABLE_EXTENSIONS.include?(File.extname(filename.to_s).delete(".").downcase)
    end

    def initialize(script_version, file: nil, content: nil, filename: nil)
      @version = script_version
      @content = content || read(file)
      @filename = filename || (file.respond_to?(:original_filename) ? file.original_filename : nil)
    end

    def call
      format = detect_format
      importer = build_importer(format)
      elements = importer.elements
      chunks = SceneSplitter.split(elements)
      raise ImportError, "No screenplay content found in #{@filename || 'the file'}" if chunks.empty?

      ActiveRecord::Base.transaction do
        @version.scenes.destroy_all
        chunks.each_with_index do |chunk, index|
          metadata = {}
          metadata["original_scene_number"] = chunk.original_number if chunk.original_number.present?
          @version.scenes.create!(
            scene_number: index + 1,
            order: index + 1,
            slugline: chunk.slugline,
            elements: chunk.elements,
            content: TextRenderer.render(chunk.elements),
            metadata: metadata
          )
        end
      end

      Result.new(
        format: format,
        scenes_count: chunks.size,
        elements_count: elements.size,
        title_page: importer.respond_to?(:title_page) ? importer.title_page : nil
      )
    end

    private

    def read(file)
      raise ImportError, "No file given" if file.nil?

      io = file.respond_to?(:tempfile) ? file.tempfile : file
      io.rewind if io.respond_to?(:rewind)
      io.read
    end

    def detect_format
      ext = File.extname(@filename.to_s).delete(".").downcase
      return :fdx if ext == "fdx" || @content.to_s.lstrip.start_with?("<?xml", "<FinalDraft")
      return :fountain if %w[fountain txt].include?(ext) || ext.empty?

      raise ImportError, "Unsupported file type .#{ext}. Import a Final Draft (.fdx), Fountain (.fountain) or plain text (.txt) file."
    end

    def build_importer(format)
      case format
      when :fdx then Fdx::Importer.new(@content)
      else Fountain::Importer.new(@content)
      end
    end
  end
end
