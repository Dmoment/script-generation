# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Screenplay::Fdx do
  let(:fixture) { file_fixture('sample.fdx').read }

  describe Screenplay::Fdx::Importer do
    subject(:elements) { described_class.new(fixture).elements }

    it 'maps Final Draft paragraph types to elements and joins styled text runs' do
      expect(elements.map { |e| e['type'] }).to eq(
        %w[action slugline action character parenthetical dialogue action transition page_break slugline action dialogue centered]
      )
      expect(elements[2]['text']).to eq('A kettle screams. Nobody moves.')
    end

    it 'splits character extensions and keeps the original scene number' do
      expect(elements[3]).to eq('type' => 'character', 'text' => 'MRS. FONSECA', 'extensions' => ['V.O.', "CONT'D"])
      expect(elements[1]['scene_number']).to eq('1')
      expect(elements[9]['scene_number']).to eq('2')
    end

    it 'turns StartsNewPage into a page break and centered General paragraphs into centered text' do
      expect(elements[8]).to eq('type' => 'page_break', 'text' => '')
      expect(elements.last).to eq('type' => 'centered', 'text' => 'THE END')
    end

    it 'exposes the title page separately' do
      expect(described_class.new(fixture).title_page).to eq(['THE KETTLE', 'Written by', 'A. Writer'])
    end

    it 'rejects documents that are not Final Draft' do
      expect { described_class.new('<html></html>').elements }.to raise_error(Screenplay::ImportError)
    end
  end

  describe 'export then import' do
    let(:company) { Company.create!(name: 'Roundtrip Co') }
    let(:user) { User.create!(auth0_id: 'auth0|rt', email: 'rt@example.com', name: 'Round Trip', company: company, role: nil) }
    let(:project) { Project.create!(title: 'P', project_type: 'film', company: company, created_by_user: user) }
    let(:script) { Script.create!(title: 'The Kettle', project: project, created_by_user: user) }
    let(:version) { script.script_versions.create!(version_number: 1) }

    it 'preserves every element, including extensions, page breaks and centered text' do
      imported = Screenplay::Fdx::Importer.new(fixture).elements
      Screenplay::SceneSplitter.split(imported).each_with_index do |chunk, i|
        version.scenes.create!(scene_number: i + 1, order: i + 1, elements: chunk.elements)
      end

      xml = Screenplay::Fdx::Exporter.new(version).export
      reimported = Screenplay::Fdx::Importer.new(xml).elements

      strip = ->(els) { els.map { |e| e.except('scene_number') } }
      expect(strip.call(reimported)).to eq(strip.call(imported))
      expect(xml).to include('Type="Scene Heading" Number="2"', "<Text>MRS. FONSECA (V.O.) (CONT'D)</Text>", 'StartsNewPage="Yes"')
      expect(xml).to include('<TitlePage>', '<Text>THE KETTLE</Text>')
    end
  end
end
