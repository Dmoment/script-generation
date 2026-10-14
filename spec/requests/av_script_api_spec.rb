# frozen_string_literal: true

require 'rails_helper'

RSpec.describe 'AV script API', type: :request do
  let(:company) { Company.create!(name: 'Agency') }
  let(:user) { User.create!(auth0_id: 'auth0|av', email: 'av@example.com', name: 'Asha Rao', company: company, role: nil) }
  let(:project) { Project.create!(title: 'Monsoon Wedding Ad', project_type: 'Ad', company: company, created_by_user: user, status: 'active') }
  let(:headers) { { 'Authorization' => 'Bearer valid_token' } }

  before do
    AccessControl.find_or_create_by(user: user, company: company, role: 'company_admin')
    validator_double = double('Auth0TokenValidator')
    allow(validator_double).to receive(:validate!).and_return(true)
    allow(validator_double).to receive(:user_info).and_return(auth0_id: user.auth0_id, email: user.email, name: user.name)
    allow(Auth0TokenValidator).to receive(:new).and_return(validator_double)
  end

  def json
    JSON.parse(response.body)
  end

  describe 'creating an AV script' do
    it 'starts with starter rows instead of a scene' do
      post '/api/v1/scripts', params: { project_id: project.id, title: 'Monsoon 30s', script_type: 'av_script' }, headers: headers
      expect(response).to have_http_status(:created)
      script = Script.find(json['id'])
      version = script.latest_version
      expect(script.av?).to be true
      expect(version.scenes.count).to eq(0)
      expect(version.av_rows.ordered.map(&:position)).to eq([1, 2, 3])
    end

    it 'rejects unknown script types' do
      post '/api/v1/scripts', params: { project_id: project.id, title: 'x', script_type: 'podcast' }, headers: headers
      expect(response).to have_http_status(:bad_request)
    end
  end

  describe 'rows' do
    let(:script) { Script.create!(title: 'Monsoon 30s', script_type: 'av_script', project: project, created_by_user: user, status: 'draft') }
    let(:version) { script.script_versions.create!(version_number: 1) }
    let!(:rows) do
      [
        version.av_rows.create!(position: 1, shot: 'WS', video: 'Rain on a courtyard', audio: 'MUSIC: sitar', duration_seconds: 5),
        version.av_rows.create!(position: 2, shot: 'MS', video: 'Bride laughs', audio: 'VO: Some days…', duration_seconds: 10),
        version.av_rows.create!(position: 3, shot: 'CU', video: 'Logo', audio: 'VO: tagline', duration_seconds: 5)
      ]
    end

    it 'lists rows in order' do
      get "/api/v1/script_versions/#{version.id}/av_rows", headers: headers
      expect(response).to have_http_status(:success)
      expect(json.map { |r| r['shot'] }).to eq(%w[WS MS CU])
    end

    it 'inserts after a row and renumbers the rest' do
      post "/api/v1/script_versions/#{version.id}/av_rows", params: { after_row_id: rows[0].id, shot: 'ECU', video: 'Henna', audio: '' }, headers: headers
      expect(response).to have_http_status(:created)
      expect(json['position']).to eq(2)
      expect(version.av_rows.ordered.map(&:shot)).to eq(%w[WS ECU MS CU])
    end

    it 'appends when no anchor is given' do
      post "/api/v1/script_versions/#{version.id}/av_rows", params: { video: 'End card' }, headers: headers
      expect(json['position']).to eq(4)
    end

    it 'updates fields and keeps the others' do
      put "/api/v1/av_rows/#{rows[1].id}", params: { audio: 'VO: Some days are made of rain.', duration_seconds: 12 }, headers: headers
      expect(response).to have_http_status(:success)
      expect(rows[1].reload.audio).to eq('VO: Some days are made of rain.')
      expect(rows[1].video).to eq('Bride laughs')
      expect(rows[1].duration_seconds).to eq(12)
    end

    it 'deletes and renumbers' do
      delete "/api/v1/av_rows/#{rows[0].id}", headers: headers
      expect(response).to have_http_status(:no_content)
      expect(version.av_rows.ordered.map { |r| [r.position, r.shot] }).to eq([[1, 'MS'], [2, 'CU']])
    end

    it 'reorders by id sequence and rejects partial lists' do
      put "/api/v1/script_versions/#{version.id}/av_rows/reorder", params: { row_ids: [rows[2].id, rows[0].id, rows[1].id] }, headers: headers
      expect(response).to have_http_status(:success)
      expect(version.av_rows.ordered.map(&:shot)).to eq(%w[CU WS MS])

      put "/api/v1/script_versions/#{version.id}/av_rows/reorder", params: { row_ids: [rows[2].id] }, headers: headers
      expect(response).to have_http_status(:unprocessable_content)
    end

    it 'exports a shot list CSV with a total' do
      get "/api/v1/script_versions/#{version.id}/shot_list", headers: headers
      expect(response).to have_http_status(:success)
      expect(response.headers['Content-Type']).to include('text/csv')
      lines = response.body.lines.map(&:strip)
      expect(lines.first).to eq('#,Shot,Video,Audio,Super,Duration (s),Notes')
      expect(lines[1]).to start_with('1,WS,Rain on a courtyard,MUSIC: sitar')
      expect(lines.last).to eq(',,,,Total,20,')
    end

    it 'refuses rows of a script the user cannot see' do
      other_user = User.create!(auth0_id: 'auth0|other', email: 'o@example.com', name: 'Other', company: Company.create!(name: 'Elsewhere'), role: nil)
      stranger = double('Auth0TokenValidator', validate!: true, user_info: { auth0_id: other_user.auth0_id, email: other_user.email, name: other_user.name })
      allow(Auth0TokenValidator).to receive(:new).and_return(stranger)
      get "/api/v1/script_versions/#{version.id}/av_rows", headers: headers
      expect(response).to have_http_status(:forbidden)
    end

    describe 'rounds' do
      it 'copies rows into the next round with lineage, and diffs rounds' do
        post "/api/v1/scripts/#{script.id}/versions", params: { notes: 'Round 2' }, headers: headers
        expect(response).to have_http_status(:created)
        round2 = ScriptVersion.find(json['id'])
        expect(round2.av_rows.ordered.map(&:source_row_id)).to eq(rows.map(&:id))
        expect(round2.scenes.count).to eq(0)

        r2 = round2.av_rows.ordered.to_a
        r2[1].update!(audio: 'VO: Some days are made of rain.')
        r2[2].destroy!
        Av::Rows.new(round2).renumber!
        Av::Rows.new(round2).insert(after_row_id: r2[0].id, shot: 'ECU', video: 'Henna', audio: '')

        get "/api/v1/script_versions/#{round2.id}/compare", params: { with: version.id }, headers: headers
        expect(response).to have_http_status(:success)
        expect(json['kind']).to eq('av')
        expect(json['summary']).to eq('unchanged' => 1, 'added' => 1, 'changed' => 1, 'removed' => 1)
        changed = json['rows'].find { |r| r['status'] == 'changed' }
        expect(changed['changed_fields']).to eq(['audio'])
        expect(changed['base']['audio']).to eq('VO: Some days…')

        get "/api/v1/script_versions/#{round2.id}/revisions", headers: headers
        expect(json['previous_version']['id']).to eq(version.id)
        expect(json['changed_row_ids'].size).to eq(2)
      end
    end
  end

  describe 'client review' do
    let(:script) { Script.create!(title: 'Monsoon 30s', script_type: 'av_script', project: project, created_by_user: user, status: 'draft') }
    let(:version) { script.script_versions.create!(version_number: 1) }
    let!(:row) { version.av_rows.create!(position: 1, shot: 'WS', video: 'Rain', audio: 'MUSIC', duration_seconds: 5) }

    def create_link(extra = {})
      post "/api/v1/script_versions/#{version.id}/review_links", params: { client_name: 'Priya at BrandCo' }.merge(extra), headers: headers
      expect(response).to have_http_status(:created)
      json
    end

    it 'creates a link with a URL and a default 14-day expiry' do
      link = create_link
      expect(link['token']).to be_present
      expect(link['url']).to eq("http://www.example.com/review/#{link['token']}")
      expect(link['status']).to eq('pending')
      expect(Time.zone.parse(link['expires_at'])).to be_within(1.minute).of(14.days.from_now)
    end

    it 'serves the round to anyone holding the token, without a login' do
      token = create_link['token']
      get "/api/v1/review/#{token}"
      expect(response).to have_http_status(:success)
      expect(json['script']['title']).to eq('Monsoon 30s')
      expect(json['script']['kind']).to eq('av')
      expect(json['round']['number']).to eq(1)
      expect(json['rows'].map { |r| r['video'] }).to eq(['Rain'])
      expect(json['total_seconds']).to eq(5)
      expect(json['client_name']).to eq('Priya at BrandCo')
    end

    it 'answers 404 for an unknown token and 410 for an expired or revoked one' do
      get '/api/v1/review/nope'
      expect(response).to have_http_status(:not_found)

      link = create_link(expires_in_days: 1)
      ReviewLink.find(link['id']).update!(expires_at: 1.hour.ago)
      get "/api/v1/review/#{link['token']}"
      expect(response).to have_http_status(:gone)

      link = create_link
      delete "/api/v1/review_links/#{link['id']}", headers: headers
      expect(response).to have_http_status(:success)
      expect(json['revoked_at']).to be_present
      get "/api/v1/review/#{link['token']}"
      expect(response).to have_http_status(:gone)
    end

    it 'takes comments on a row, rejects rows from another round, and shows them to the writer' do
      token = create_link['token']
      post "/api/v1/review/#{token}/comments", params: { author_name: 'Priya', body: 'Can we open on the bride instead?', av_row_id: row.id }
      expect(response).to have_http_status(:created)
      expect(json['author_name']).to eq('Priya')

      other = script.script_versions.create!(version_number: 2).av_rows.create!(position: 1)
      post "/api/v1/review/#{token}/comments", params: { author_name: 'Priya', body: 'x', av_row_id: other.id }
      expect(response).to have_http_status(:unprocessable_content)

      post "/api/v1/review/#{token}/comments", params: { author_name: '', body: 'x' }
      expect(response).to have_http_status(:unprocessable_content)

      get "/api/v1/script_versions/#{version.id}/review_comments", headers: headers
      expect(json.size).to eq(1)
      put "/api/v1/review_comments/#{json.first['id']}/resolve", params: { resolved: true }, headers: headers
      expect(json['resolved_at']).to be_present

      get "/api/v1/script_versions/#{version.id}/review_links", headers: headers
      expect(json.first['comment_count']).to eq(1)
      expect(json.first['open_comment_count']).to eq(0)
    end

    it 'records approval and change requests with the reviewer name' do
      token = create_link['token']
      post "/api/v1/review/#{token}/decision", params: { decision: 'changes_requested', name: 'Priya', note: 'Shorter VO please' }
      expect(response).to have_http_status(:created)
      expect(json['status']).to eq('changes_requested')
      expect(json['decision_note']).to eq('Shorter VO please')

      post "/api/v1/review/#{token}/decision", params: { decision: 'approved', name: 'Priya' }
      expect(json['status']).to eq('approved')
      expect(json['decided_by_name']).to eq('Priya')

      post "/api/v1/review/#{token}/decision", params: { decision: 'maybe', name: 'Priya' }
      expect(response).to have_http_status(:bad_request)
    end

    it 'does not accept a review token as a bearer token on writer endpoints' do
      token = create_link['token']
      allow(Auth0TokenValidator).to receive(:new).and_call_original
      get "/api/v1/script_versions/#{version.id}/av_rows", headers: { 'Authorization' => "Bearer #{token}" }
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
