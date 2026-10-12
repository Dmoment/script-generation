# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Screenplay::ScriptImporter do
  let(:company) { Company.create!(name: 'Import Co') }
  let(:user) { User.create!(auth0_id: 'auth0|imp', email: 'imp@example.com', name: 'Importer', company: company, role: nil) }
  let(:project) { Project.create!(title: 'P', project_type: 'film', company: company, created_by_user: user) }
  let(:script) { Script.create!(title: 'Imported', project: project, created_by_user: user) }
  let(:version) { script.script_versions.create!(version_number: 1) }

  before { version.scenes.create!(scene_number: 1, slugline: 'INT. LOCATION - DAY', content: '', order: 1) }

  it 'replaces the placeholder scene with one scene per heading from an FDX file' do
    result = described_class.new(version, content: file_fixture('sample.fdx').read, filename: 'kettle.fdx').call

    expect(result.format).to eq(:fdx)
    expect(result.scenes_count).to eq(3)
    scenes = version.scenes.ordered
    expect(scenes.map(&:slugline)).to eq([nil, 'INT. KITCHEN - NIGHT', 'EXT. PIER - DAWN'])
    expect(scenes.map(&:scene_number)).to eq([1, 2, 3])
    expect(scenes.second.metadata['original_scene_number']).to eq('1')
    expect(scenes.second.content).to include("MRS. FONSECA (V.O.) (CONT'D)\n(flat)\nNot again.")
    expect(scenes.second.character_names).to eq(['MRS. FONSECA'])
  end

  it 'imports plain text through the Fountain reader' do
    result = described_class.new(version, content: "INT. ROOM - DAY\n\nA chair.\n\nBOB\nHi.", filename: 'notes.txt').call
    expect(result.format).to eq(:fountain)
    expect(version.scenes.count).to eq(1)
    expect(version.scenes.first.elements.map { |e| e['type'] }).to eq(%w[slugline action character dialogue])
  end

  it 'detects Final Draft XML even without an .fdx extension' do
    result = described_class.new(version, content: file_fixture('sample.fdx').read, filename: 'export.xml').call
    expect(result.format).to eq(:fdx)
  end

  it 'refuses unsupported files and leaves the scenes untouched' do
    expect { described_class.new(version, content: '%PDF-1.4', filename: 'script.pdf').call }
      .to raise_error(Screenplay::ImportError, /Unsupported file type/)
    expect(version.scenes.count).to eq(1)
  end

  it 'refuses empty documents and leaves the scenes untouched' do
    expect { described_class.new(version, content: "\n\n", filename: 'empty.fountain').call }
      .to raise_error(Screenplay::ImportError, /No screenplay content/)
    expect(version.scenes.count).to eq(1)
  end

  it 'knows which filenames it can import' do
    expect(described_class.importable?('a.FDX')).to be(true)
    expect(described_class.importable?('a.fountain')).to be(true)
    expect(described_class.importable?('a.pdf')).to be(false)
  end
end
