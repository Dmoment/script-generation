# Seeds a two-column AV script ("Monsoon Wedding – 30s TVC") with two rounds,
# a client review link, client comments and an approval, so the AV editor,
# review panel and public review page have real data.
#
#   SEED_EMAIL=someone@example.com bin/rails runner db/seeds/sample_av_script.rb
#
# Idempotent: re-running for the same user does nothing unless SEED_FORCE=1.

email = ENV.fetch("SEED_EMAIL") { abort "SEED_EMAIL is required" }
user  = User.find_by!(email: email.downcase.strip)
company = user.company || user.companies.first
abort "User #{email} has no company/workspace" unless company

PROJECT_TITLE = "Monsoon Wedding – Festive Campaign"
SCRIPT_TITLE  = "Monsoon Wedding 30s TVC"

existing = Script.joins(:project).where(projects: { company_id: company.id }, title: SCRIPT_TITLE, script_type: "av_script").first
if existing && ENV["SEED_FORCE"] != "1"
  puts "AV sample already seeded for #{email} (script ##{existing.id}); set SEED_FORCE=1 to replace"
  exit
end
existing&.destroy!

ROUND_ONE = [
  { shot: "WS", video: "Grey monsoon sky over a Delhi courtyard. Rain hammers a marigold-strung mandap. Guests huddle under a sagging tarp.", audio: "SFX: rain, thunder. MUSIC: a lone sitar, hesitant.", duration_seconds: 4 },
  { shot: "MS", video: "The BRIDE (28) peeks from a doorway, lehenga hitched up, eyes on the mud between her and the mandap.", audio: "VO: Everyone plans the perfect day.", duration_seconds: 4 },
  { shot: "CU", video: "Her mother's hand tightens on her arm. A beat. The bride grins and kicks off her heels.", audio: "VO: Nobody plans the rain.", duration_seconds: 3 },
  { shot: "WS, slow-mo", video: "She runs barefoot through the downpour, lehenga flying, cousins shrieking behind her with dupattas as umbrellas.", audio: "MUSIC: the sitar breaks into a full dhol-driven track.", duration_seconds: 6 },
  { shot: "MS", video: "She arrives at the mandap soaked and laughing. The GROOM wipes rain from his glasses, speechless.", audio: "SFX: dhol, cheering. GROOM: (laughing) You're late.  BRIDE: I'm here.", duration_seconds: 5 },
  { shot: "CU", video: "Close on both their hands, henna running slightly, holding tight.", audio: "VO: Some days are made of rain.", duration_seconds: 3 },
  { shot: "Product", video: "Pack shot: FestiveSip Mango Cooler bottle beads with condensation beside the sweets tray.", audio: "VO: Make them yours.", super_text: "FESTIVESIP · MADE FOR THE MOMENT", duration_seconds: 3 },
  { shot: "End card", video: "Logo on wet marigold background.", audio: "MUSIC: sting out.", super_text: "#MadeForTheMoment", duration_seconds: 2 }
].freeze

ActiveRecord::Base.transaction do
  project_type = ProjectType.find_or_create_by!(name: "Ad")
  project = Project.find_or_create_by!(company: company, title: PROJECT_TITLE) do |p|
    p.project_type = project_type.name
    p.created_by_user = user
    p.status = "active"
  end
  AccessControl.find_or_create_by!(user: user, company: company, project: project, role: "project_admin") rescue nil

  script = Script.create!(project: project, title: SCRIPT_TITLE, script_type: "av_script", status: "active", created_by_user: user,
                          description: "30-second festive TVC. Barefoot bride, monsoon, mango cooler.")
  round1 = script.script_versions.create!(version_number: 1, notes: "Round 1 – first pass to client")
  ROUND_ONE.each_with_index { |attrs, i| round1.av_rows.create!(attrs.merge(position: i + 1)) }

  # Client reviewed round 1 and asked for changes.
  link1 = round1.review_links.create!(created_by_user: user, client_name: "Priya Menon, FestiveSip", expires_at: 14.days.from_now, created_at: 3.days.ago)
  r1 = round1.av_rows.ordered.to_a
  link1.review_comments.create!(author_name: "Priya Menon", av_row_id: r1[1].id, body: "Can the opening VO land on the product promise sooner? Feels slow.", created_at: 2.days.ago)
  link1.review_comments.create!(author_name: "Priya Menon", av_row_id: r1[6].id, body: "Legal needs the bottle label fully visible for at least 2s.", created_at: 2.days.ago)
  link1.review_comments.create!(author_name: "Karan (brand)", body: "Love the barefoot run. Keep that at all costs.", created_at: 2.days.ago)
  link1.decide!("changes_requested", name: "Priya Menon", note: "Tighten the first 10s and give the pack shot more time.")
  link1.update_columns(decided_at: 2.days.ago)

  # Round 2 answers the notes.
  round2 = Screenplay::VersionCloner.new(script, source_version: round1, notes: "Round 2 – tightened open, longer pack shot").call
  r2 = round2.av_rows.ordered.to_a
  r2[1].update!(audio: "VO: Everyone plans the perfect day. Nobody plans the rain.", duration_seconds: 4)
  Av::Rows.new(round2).destroy(r2[2])
  r2 = round2.av_rows.ordered.to_a
  r2[5].update!(duration_seconds: 4, video: "Pack shot: FestiveSip Mango Cooler bottle, label square to camera, beads with condensation beside the sweets tray.")
  link1.review_comments.where(av_row_id: [r1[1].id, r1[6].id]).update_all(resolved_at: 1.day.ago)

  link2 = round2.review_links.create!(created_by_user: user, client_name: "Priya Menon, FestiveSip", expires_at: 14.days.from_now, created_at: 1.day.ago)
  link2.review_comments.create!(author_name: "Priya Menon", av_row_id: round2.av_rows.ordered.to_a[1].id, body: "Perfect. Approved from our side.", created_at: 6.hours.ago)
  link2.decide!("approved", name: "Priya Menon", note: "Go to production.")
  link2.update_columns(decided_at: 6.hours.ago)

  puts "Seeded AV script ##{script.id} '#{SCRIPT_TITLE}' for #{email}: round 1 (changes requested), round 2 (approved)"
  puts "  Review link round 2: /review/#{link2.token}"
end
