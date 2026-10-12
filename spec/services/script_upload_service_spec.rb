# frozen_string_literal: true

require 'rails_helper'

RSpec.describe ScriptUploadService do
  let(:company) { Company.create!(name: 'Upload Co') }
  let(:user) { User.create!(auth0_id: 'auth0|up', email: 'up@example.com', name: 'Uploader', company: company, role: nil) }
  let(:project) { Project.create!(title: 'P', project_type: 'film', company: company, created_by_user: user) }

  def upload(path, type)
    tempfile = Tempfile.new(['upload', File.extname(path)])
    tempfile.write(File.read(path))
    tempfile.rewind
    ActionDispatch::Http::UploadedFile.new(tempfile: tempfile, filename: File.basename(path), type: type)
  end

  it 'parses a Final Draft upload into scenes' do
    script = described_class.new(project: project, user: user, params: { title: 'Kettle', file: upload(file_fixture('sample.fdx'), 'application/xml') }).call
    version = script.script_versions.first
    expect(version.file).to be_attached
    expect(version.scenes.count).to eq(3)
    expect(version.scenes.ordered.second.slugline).to eq('INT. KITCHEN - NIGHT')
  end

  it 'parses a Fountain upload into scenes' do
    script = described_class.new(project: project, user: user, params: { title: 'Kettle', file: upload(file_fixture('sample.fountain'), 'text/plain') }).call
    expect(script.script_versions.first.scenes.map(&:slugline)).to include('INT. KITCHEN - NIGHT', 'MONTAGE - THE LAST CROSSING')
  end

  it 'keeps the placeholder scene for a PDF upload' do
    pdf = Tempfile.new(['script', '.pdf']).tap { |f| f.write('%PDF-1.4'); f.rewind }
    script = described_class.new(project: project, user: user, params: { title: 'Kettle', file: ActionDispatch::Http::UploadedFile.new(tempfile: pdf, filename: 'script.pdf', type: 'application/pdf') }).call
    version = script.script_versions.first
    expect(version.file).to be_attached
    expect(version.scenes.map(&:slugline)).to eq(['INT. LOCATION - DAY'])
  end
end
