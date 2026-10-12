# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Screenplay::Fountain do
  let(:fixture) { file_fixture('sample.fountain').read }

  describe Screenplay::Fountain::Importer do
    let(:importer) { described_class.new(fixture) }
    subject(:elements) { importer.elements }

    it 'reads the title page, including multi-line values' do
      expect(importer.title_page).to include('title' => 'The Kettle', 'author' => 'A. Writer', 'contact' => 'a.writer@example.com')
      expect(elements.map { |e| e['text'] }).not_to include('Title: The Kettle')
    end

    it 'drops sections, synopses, notes and boneyard' do
      texts = elements.map { |e| e['text'] }
      expect(texts.join(' ')).not_to include('Act One', 'kettle boils', 'note for the editor', 'boneyard')
      expect(elements[2]['text']).to eq('A kettle screams. Nobody moves.')
    end

    it 'honours forced elements and strips the dual-dialogue caret' do
      expect(elements.map { |e| [ e['type'], e['text'] ] }).to include(
        [ 'action', 'SILENCE' ],
        [ 'transition', 'SMASH CUT TO:' ],
        [ 'slugline', 'MONTAGE - THE LAST CROSSING' ],
        [ 'character', 'TANVI' ],
        [ 'character', 'MCCONNELL' ],
        [ 'centered', 'THE END' ]
      )
      expect(elements.find { |e| e['text'] == 'MRS. FONSECA' }['extensions']).to eq([ 'V.O.', "CONT'D" ])
    end
  end

  describe 'export then import' do
    let(:company) { Company.create!(name: 'Roundtrip Co') }
    let(:user) { User.create!(auth0_id: 'auth0|rt2', email: 'rt2@example.com', name: 'Round Trip', company: company, role: nil) }
    let(:project) { Project.create!(title: 'P', project_type: 'film', company: company, created_by_user: user) }
    let(:script) { Script.create!(title: 'The Kettle', project: project, created_by_user: user) }
    let(:version) { script.script_versions.create!(version_number: 1, notes: 'First draft') }

    it 'preserves the elements through a Fountain document with a title page' do
      imported = Screenplay::Fountain::Importer.new(fixture).elements
      Screenplay::SceneSplitter.split(imported).each_with_index do |chunk, i|
        version.scenes.create!(scene_number: i + 1, order: i + 1, elements: chunk.elements)
      end

      text = Screenplay::Fountain::Exporter.new(version).export
      expect(text).to start_with("Title: The Kettle\n")
      expect(text).to include("MRS. FONSECA (V.O.) (CONT'D)\n(flat)\nNot again.", '!SILENCE', '> THE END <')

      reimported = Screenplay::Fountain::Importer.new(text).elements
      expect(reimported).to eq(imported)
    end
  end
end
