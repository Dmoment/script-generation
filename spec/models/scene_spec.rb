# frozen_string_literal: true

require 'rails_helper'

RSpec.describe Scene do
  let(:company) { Company.create!(name: 'Scene Co') }
  let(:user) { User.create!(auth0_id: 'auth0|scene', email: 'scene@example.com', name: 'S', company: company, role: nil) }
  let(:project) { Project.create!(title: 'P', project_type: 'film', company: company, created_by_user: user) }
  let(:script) { Script.create!(title: 'S', project: project, created_by_user: user) }
  let(:version) { script.script_versions.create!(version_number: 1) }

  it 'derives elements and slugline when only content is saved' do
    scene = version.scenes.create!(scene_number: 1, order: 1, content: "INT. KITCHEN - NIGHT\n\nA kettle.\n\nMIRA (V.O.)\n(flat)\nNot again.")
    expect(scene.elements.map { |e| e['type'] }).to eq(%w[slugline action character parenthetical dialogue])
    expect(scene.elements[2]).to include('text' => 'MIRA', 'extensions' => [ 'V.O.' ])
    expect(scene.slugline).to eq('INT. KITCHEN - NIGHT')
  end

  it 'derives content when only elements are saved' do
    scene = version.scenes.create!(scene_number: 1, order: 1, elements: [
      { 'type' => 'slugline', 'text' => 'EXT. PIER - DAY' },
      { 'type' => 'action', 'text' => 'Gulls.' },
      { 'type' => 'character', 'text' => 'BABA', 'extensions' => [ "CONT'D" ] },
      { 'type' => 'dialogue', 'text' => 'She knows.' }
    ])
    expect(scene.content).to eq("EXT. PIER - DAY\n\nGulls.\n\nBABA (CONT'D)\nShe knows.")
    expect(scene.slugline).to eq('EXT. PIER - DAY')
  end

  it 'keeps an explicit slugline when the saved elements have no heading' do
    scene = version.scenes.create!(scene_number: 1, order: 1, slugline: 'INT. LOCATION - DAY', content: '')
    scene.update!(elements: [ { 'type' => 'action', 'text' => 'No heading here.' } ])
    expect(scene.slugline).to eq('INT. LOCATION - DAY')
    expect(scene.content).to eq('No heading here.')
  end

  it 'writes a heading edited on its own into the heading element and the text' do
    scene = version.scenes.create!(scene_number: 1, order: 1, elements: [
      { 'type' => 'slugline', 'text' => 'INT. LOCATION - DAY' },
      { 'type' => 'action', 'text' => 'Rain on the dock.' }
    ])
    scene.update!(slugline: 'EXT. DOCK - NIGHT')
    expect(scene.elements.first).to include('type' => 'slugline', 'text' => 'EXT. DOCK - NIGHT')
    expect(scene.content).to eq("EXT. DOCK - NIGHT\n\nRain on the dock.")
  end

  it 'prepends a heading element when a heading is set on a scene without one' do
    scene = version.scenes.create!(scene_number: 1, order: 1, elements: [ { 'type' => 'action', 'text' => 'Gulls.' } ])
    scene.update!(slugline: 'EXT. PIER - DAY')
    expect(scene.elements.map { |e| e['type'] }).to eq(%w[slugline action])
  end

  it 'leaves both untouched when both are given' do
    scene = version.scenes.create!(scene_number: 1, order: 1, content: 'custom text', elements: [ { 'type' => 'action', 'text' => 'different' } ])
    expect(scene.content).to eq('custom text')
    expect(scene.elements.first['text']).to eq('different')
  end

  it 'round-trips its own text through the parser' do
    elements = [
      { 'type' => 'slugline', 'text' => 'INT. SEA SPARROW - WHEELHOUSE - MORNING' },
      { 'type' => 'action', 'text' => 'Cramped. Brass fittings gone green.' },
      { 'type' => 'character', 'text' => 'MRS. FONSECA' },
      { 'type' => 'dialogue', 'text' => 'Return.' },
      { 'type' => 'character', 'text' => 'BABA', 'extensions' => [ 'V.O.' ] },
      { 'type' => 'parenthetical', 'text' => '(over crackling speaker)' },
      { 'type' => 'dialogue', 'text' => 'Sit down.' },
      { 'type' => 'transition', 'text' => 'FADE OUT.' }
    ]
    scene = version.scenes.create!(scene_number: 1, order: 1, elements: elements)
    expect(Screenplay::Parser.new.parse(scene.content)).to eq(elements)
  end
end
