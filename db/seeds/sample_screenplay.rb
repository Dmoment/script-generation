# Seeds a complete, properly formatted sample screenplay ("The Last Ferry")
# into a user's workspace so the editor, corkboard and outline views have
# real data to show.
#
#   SEED_EMAIL=someone@example.com bin/rails runner db/seeds/sample_screenplay.rb
#   # or inside a running container, piped over stdin:
#   SEED_EMAIL=... bin/rails runner - < db/seeds/sample_screenplay.rb
#
# Idempotent: re-running for the same user does nothing unless SEED_FORCE=1,
# which replaces the previously seeded script.

email = ENV.fetch("SEED_EMAIL") { abort "SEED_EMAIL is required" }
user  = User.find_by!(email: email.downcase.strip)
company = user.company || user.companies.first
abort "User #{email} has no company/workspace" unless company

PROJECT_TITLE = "The Last Ferry"
SCRIPT_TITLE  = "The Last Ferry"

# --- Tiny explicit markup -> elements ---------------------------------------
# INT./EXT. ...     slugline            @NAME (V.O.)   character (+extensions)
# (beat)            parenthetical       > CUT TO:      transition
# lines after a character/parenthetical are dialogue until a blank line
# everything else is action
def build_elements(text)
  elements = []
  in_dialogue = false
  text.strip.each_line do |raw|
    line = raw.rstrip
    if line.strip.empty?
      in_dialogue = false
      next
    end
    stripped = line.strip
    if stripped =~ /\A(INT\.|EXT\.|INT\.\/EXT\.|I\/E\.)/
      elements << { "type" => "slugline", "text" => stripped.upcase }
      in_dialogue = false
    elsif stripped.start_with?(">")
      elements << { "type" => "transition", "text" => stripped.delete_prefix(">").strip.upcase }
      in_dialogue = false
    elsif stripped.start_with?("@")
      name = stripped.delete_prefix("@").strip
      extensions = []
      while name =~ /\s*\(([^)]+)\)\s*\z/
        extensions.unshift($1.upcase)
        name = name.sub(/\s*\([^)]+\)\s*\z/, "")
      end
      el = { "type" => "character", "text" => name.upcase }
      el["extensions"] = extensions if extensions.any?
      elements << el
      in_dialogue = true
    elsif in_dialogue && stripped =~ /\A\(.+\)\z/
      elements << { "type" => "parenthetical", "text" => stripped }
    elsif in_dialogue
      elements << { "type" => "dialogue", "text" => stripped }
    else
      elements << { "type" => "action", "text" => stripped }
    end
  end
  elements
end

SCENES = [
  {
    meta: { act: "Act 1", tone: "Calm", purpose: "Establish Mira, the island and the ferry's last day", duration: "1:30",
            status: "Revised", beats: [ "Dawn on the pier", "The 'LAST CROSSING' sign", "Mira's routine" ],
            summary: "Dawn. Mira, 34, opens the ticket booth on a near-empty island pier for the ferry's final day of service." },
    text: <<~SCENE
      EXT. KALIDHAR ISLAND PIER - DAWN

      Fog sits low on grey water. A rusted ferry, the SEA SPARROW, rocks against bald tyres lashed to the pier.

      A hand-painted sign is zip-tied to the gate: LAST CROSSING 6 PM TODAY. THANK YOU FOR 41 YEARS.

      MIRA (34), windbreaker two sizes too big, unlocks a plywood ticket booth. Inside: a kettle, a cash tin, a transistor radio.

      She clicks the radio on. Static, then a cricket commentary nobody asked for.

      She lines up the rubber stamps. Ink pad. Tickets. Same as every morning.

      @MIRA
      (to herself)
      Forty-one years and they couldn't spring for a laminated sign.

      Across the water, the mainland is a smudge. A single gull lands on the sign and shits on it.

      @MIRA (CONT'D)
      Fair.
    SCENE
  },
  {
    meta: { act: "Act 1", tone: "Warm", purpose: "Introduce Baba and the stakes of the last day", duration: "2:10",
            status: "Revised", beats: [ "Baba arrives late", "The engine cough", "Mira hides the eviction letter" ],
            summary: "Mira's father Baba, the ferry's captain, arrives late and hungover. She hides a council letter from him." },
    text: <<~SCENE
      INT. SEA SPARROW - WHEELHOUSE - MORNING

      Cramped. Brass fittings gone green. A photo of a younger BABA with a full head of hair taped above the wheel.

      BABA (67), the real one, grey and unshaven, climbs in with a thermos. He moves like his knees are negotiating.

      @BABA
      Don't say it.

      @MIRA
      I didn't say anything.

      @BABA
      You said it with your face.

      He turns the key. The engine coughs, catches, dies. He tries again. It holds, barely.

      @BABA (CONT'D)
      She knows.

      @MIRA
      It's a diesel engine, Baba. It doesn't know anything.

      @BABA
      Forty-one years. She knows.

      Mira pulls a folded letter from her windbreaker. Council crest. She reads two lines, folds it smaller, shoves it back.

      @BABA (CONT'D)
      What's that?

      @MIRA
      Ticket stock.

      He looks at her a beat too long. Lets it go.

      @BABA
      First run in ten minutes. Go sell your tickets.
    SCENE
  },
  {
    meta: { act: "Act 1", tone: "Warm", purpose: "The regulars; show what the ferry means to the island", duration: "1:45",
            status: "Draft", beats: [ "Mrs. Fonseca and her chickens", "The schoolkids", "Nobody wants to say goodbye" ],
            summary: "The morning regulars board for the last time: a widow with chickens, a pair of schoolkids, a fisherman who won't make eye contact." },
    text: <<~SCENE
      EXT. KALIDHAR ISLAND PIER - CONTINUOUS

      A thin line at the booth. Mira stamps tickets without looking up.

      MRS. FONSECA (70s), cardigan buttoned wrong, carries a crate of three indignant chickens.

      @MRS. FONSECA
      Return.

      @MIRA
      There's no return, Mrs. Fonseca. Six o'clock is the last one back.

      @MRS. FONSECA
      Then I'll be back by six.

      @MIRA
      (stamping)
      Return.

      Two SCHOOLKIDS, TANVI (11) and her little brother ROHAN (8), shove through the gate with one ticket between them.

      @TANVI
      He's under five.

      @MIRA
      He's got a moustache, Tanvi.

      @ROHAN
      (proud)
      It's coming in.

      Mira stamps one ticket. Waves them through.

      Last in line: JOSEPH (50s), a fisherman, hands like rope. He puts exact change on the counter and does not look at her.

      @JOSEPH
      Hear your dad's selling the boat.

      @MIRA
      Scrap, not selling. There's a difference.

      @JOSEPH
      Not to the boat.

      He takes his ticket and walks off. Mira watches him go.
    SCENE
  },
  {
    meta: { act: "Act 1", tone: "Calm", purpose: "The crossing itself as ritual; plant the engine problem", duration: "1:20",
            status: "Draft", beats: [ "Baba's announcement", "Rohan at the rail", "Engine stutter #1" ],
            summary: "First crossing. Baba makes his usual announcement. The engine stutters mid-channel and nobody but Mira notices." },
    text: <<~SCENE
      EXT. SEA SPARROW - DECK - MORNING

      The island slides away. Chickens complain. Rohan hangs over the rail, spitting into the wake, timing it.

      @BABA (V.O.)
      (over crackling speaker)
      Good morning, this is your captain. Crossing time twenty-two minutes, weather's doing its best, and if anyone asks, the life jackets are under your seat.

      @TANVI
      (to Rohan)
      They're not.

      @ROHAN
      I checked. It's a bucket.

      Mira walks the deck with the cash tin under her arm. Mid-channel, the engine note drops. A stutter. Half a second.

      Everyone keeps talking. Mira stops. Looks at the wheelhouse.

      Through the glass, Baba's hand is flat on the console, like you'd steady a horse.

      The note comes back. Mira breathes.
    SCENE
  },
  {
    meta: { act: "Act 2", tone: "Tense", purpose: "Reveal the letter; Mira and Baba's real conflict", duration: "2:40",
            status: "Revised", beats: [ "Mainland terminal", "The council officer", "Baba reads the letter" ],
            summary: "On the mainland, a council officer presses Mira about the scrapping deadline. Baba finds the letter: the council will fine him for every day the ferry sits unsold." },
    text: <<~SCENE
      EXT. MAINLAND FERRY TERMINAL - DAY

      Concrete and pigeons. A new catamaran, white and smug, idles at the far berth. Banner: ISLAND EXPRESS - 9 MINUTES - LAUNCHING MONDAY.

      PRADEEP (40s), council lanyard, polo shirt tucked in with intent, intercepts Mira at the gangway.

      @PRADEEP
      Ms. D'Souza. Did your father get the notice?

      @MIRA
      He got it.

      @PRADEEP
      Because the scrap yard needs the hull by Friday or the berth fee rolls over. I can't keep stopping that.

      @MIRA
      You could try.

      @PRADEEP
      (genuinely)
      I did try. For about a year. Nobody rides a boat that takes twenty-two minutes when there's one that takes nine.

      Behind them, Baba steps off the gangway. He has the letter. Unfolded. Mira sees it and the ground tilts.

      @BABA
      Ticket stock.

      @MIRA
      Baba -

      @BABA
      (reading)
      "Daily penalty of four thousand rupees for non-removal of vessel." Four thousand. A day.

      @PRADEEP
      Mr. D'Souza, I can walk you through -

      @BABA
      You can walk.

      Pradeep, to his credit, walks.

      Baba folds the letter back along Mira's creases. Hands it to her.

      @BABA (CONT'D)
      How long have you had this.

      @MIRA
      Nine days.

      @BABA
      Thirty-six thousand rupees of not telling me.

      He goes back aboard. Mira stands there with the letter and the pigeons.
    SCENE
  },
  {
    meta: { act: "Act 2", tone: "Cool", purpose: "Midpoint: Joseph's offer, the alternative to scrapping", duration: "2:00",
            status: "Draft", beats: [ "Joseph in the hold", "The offer", "Mira can't afford hope" ],
            summary: "Joseph finds Mira in the hold and makes an offer: the fishermen will buy the Sea Sparrow as a cooperative, if Baba will teach them to run it." },
    text: <<~SCENE
      INT. SEA SPARROW - LOWER HOLD - DAY

      Diesel and old rope. Mira sits on a coil of it, counting the cash tin. It doesn't take long.

      Joseph ducks under the hatch. He doesn't come all the way in.

      @JOSEPH
      Twelve of us.

      @MIRA
      Twelve of you what.

      @JOSEPH
      Boats. The co-op. We've been talking.

      He puts a folded page on the crate. Numbers in pencil. Somebody's done this carefully.

      @JOSEPH (CONT'D)
      Scrap gives him ninety thousand and a bad week. We can do one lakh twenty. Over a year. And he keeps the wheel until he's taught Arjun and me to not kill anyone.

      Mira looks at the page. Doesn't touch it.

      @MIRA
      He won't take charity.

      @JOSEPH
      It's not charity. We need to get fish to the mainland and the catamaran won't carry crates. They told us. "Passenger only." Nine minutes and you can't bring a fish.

      @MIRA
      (beat)
      Why are you telling me and not him.

      @JOSEPH
      Because you're the one who hid the letter. You already know what he'll say.

      He goes. Mira picks up the page. Reads it twice.
    SCENE
  },
  {
    meta: { act: "Act 2", tone: "Intense", purpose: "The engine fails; crisis at sea", duration: "2:30",
            status: "Draft", beats: [ "Afternoon crossing", "Full engine failure", "Baba in the engine room" ],
            summary: "On the afternoon crossing the engine dies completely. The Sea Sparrow drifts toward the channel markers with twenty people aboard." },
    text: <<~SCENE
      EXT. SEA SPARROW - DECK - LATE AFTERNOON

      Fuller now. Islanders coming home with mainland shopping. Mrs. Fonseca's chickens are down to two. She's not discussing it.

      The engine note drops. Stutters. Mira is already moving.

      It dies.

      Silence except water. Then every passenger at once.

      @BABA (V.O.)
      (speaker)
      Nothing to worry about. Sit down.

      @TANVI
      That's what you say when there's something to worry about.

      > SMASH CUT TO:

      INT. SEA SPARROW - ENGINE ROOM - CONTINUOUS

      Heat and dark. Baba on his bad knees in front of an engine the size of a car, torch in his teeth.

      Mira drops down the ladder.

      @MIRA
      Tell me.

      @BABA
      (around the torch)
      Fuel line. Or the pump. Or she's just decided.

      @MIRA
      Baba.

      He takes the torch out of his mouth.

      @BABA
      Current's taking us toward the markers. We've got maybe fifteen minutes before I have to call it in and let the nine-minute boat come and watch.

      @MIRA
      Then fix it.

      @BABA
      I'm sixty-seven and I can't see the bolts.

      A beat. Mira takes the torch. Kneels next to him. Holds the light exactly where his hands are.

      @MIRA
      I can.
    SCENE
  },
  {
    meta: { act: "Act 2", tone: "Tense", purpose: "Father and daughter fix the engine together; the real conversation", duration: "2:45",
            status: "Draft", beats: [ "Bleeding the fuel line", "Why she hid the letter", "The engine turns over" ],
            summary: "Working on the engine together, Mira admits why she hid the letter. Baba admits he already knew the boat was finished. The engine turns over." },
    text: <<~SCENE
      INT. SEA SPARROW - ENGINE ROOM - CONTINUOUS

      Baba's hands on the fuel line. Mira's torch steady on them. Above, the muffled scrape of someone dragging a bench.

      @BABA
      Bleed valve. Quarter turn. Stop when it spits.

      She does. It spits diesel on both of them.

      @MIRA
      I hid the letter because you'd have done this.

      @BABA
      Done what.

      @MIRA
      Fixed her. Again. Spent the scrap money on a pump and then there's no scrap money and no boat and no -

      @BABA
      Hand me the eleven.

      She finds the spanner by feel. Hands it over.

      @BABA (CONT'D)
      I knew in March. The surveyor. He didn't say "scrap." He said "I wouldn't put my mother on it," which is worse.

      @MIRA
      You didn't tell me.

      @BABA
      You didn't tell me.

      @MIRA
      (beat)
      Joseph wants to buy her. The co-op. One lakh twenty over a year, and you teach them.

      His hands stop.

      @BABA
      Teach them what. How to sink?

      @MIRA
      How to not. You'd still have the wheel. Just - not alone.

      Long silence. Somewhere above, a chicken.

      @BABA
      Quarter turn back. Then try her.

      Mira climbs. We stay on Baba, in the dark, torchlight gone with her. The starter grinds. Grinds.

      Catches.

      Baba closes his eyes. Puts his hand flat on the block.

      @BABA (CONT'D)
      (quiet)
      Good girl.

      We don't know which of them he means.
    SCENE
  },
  {
    meta: { act: "Act 3", tone: "Warm", purpose: "The final crossing; Baba's decision", duration: "2:15",
            status: "Draft", beats: [ "Six o'clock run", "Baba's last announcement", "He hands Joseph the wheel" ],
            summary: "The six o'clock crossing. Baba makes his last announcement, then calls Joseph into the wheelhouse and puts his hands on the wheel." },
    text: <<~SCENE
      EXT. SEA SPARROW - DECK - DUSK

      Gold light. The deck is packed; the whole island came for the last one. Someone has brought a drum. Someone else has brought a better drum.

      Mira at the rail with the cash tin. She hasn't opened it. Nobody paid. She didn't ask.

      @BABA (V.O.)
      (speaker, slow)
      This is your captain. Crossing time twenty-two minutes. Weather's doing its best. Life jackets are under your seat.

      @ROHAN
      (shouting up)
      IT'S A BUCKET!

      Laughter. Then, through the speaker, Baba laughing too, which nobody has heard before.

      @BABA (V.O.)
      It's a bucket. Joseph. Wheelhouse.

      Joseph, at the bow, goes still. Looks at Mira. She nods once.

      > CUT TO:

      INT. SEA SPARROW - WHEELHOUSE - CONTINUOUS

      Joseph fills the doorway. Baba doesn't turn around.

      @BABA
      You've been on boats your whole life.

      @JOSEPH
      Small ones.

      @BABA
      She's a small one with opinions. Come here.

      Joseph comes. Baba takes Joseph's rope-hands and puts them on the wheel, under his own. Holds them there.

      @BABA (CONT'D)
      Feel that? Pulling left. She always pulls left. Don't correct it. Let her, then bring her back. Like a dog on a lead.

      @JOSEPH
      One lakh twenty. Over a year. I meant it.

      @BABA
      I know what you meant. Quiet. Feel the boat.

      Baba takes his hands away. Joseph's stay. The Sea Sparrow pulls left, and he lets her, and he brings her back.

      Through the glass, Mira watches. She opens the cash tin. Puts the council letter inside. Closes it.
    SCENE
  },
  {
    meta: { act: "Act 3", tone: "Calm", purpose: "Resolution: the sign comes down, the ferry stays", duration: "1:15",
            status: "Draft", beats: [ "Pier at night", "Mira takes down the sign", "The gull" ],
            summary: "Night. The ferry is tied up for the night, not the last time. Mira cuts down the sign. Baba, below, starts the engine just to hear it." },
    text: <<~SCENE
      EXT. KALIDHAR ISLAND PIER - NIGHT

      Empty again. The drums have gone home. The Sea Sparrow creaks against her tyres.

      Mira stands at the gate with a kitchen knife. She cuts the zip ties. The sign comes down. LAST CROSSING 6 PM TODAY.

      She looks at it. Turns it over. Blank on the back.

      She leans it against the booth, blank side out.

      From below decks, the engine turns over. Catches. Holds. Nobody's going anywhere. He just wanted to hear it.

      Mira sits on the edge of the pier and listens to it idle.

      The gull lands on the blank sign. Considers it. Leaves it alone.

      > FADE OUT.
    SCENE
  }
]

# Production breakdown tags per scene number (props, costumes, ... as a crew would tag them).
BREAKDOWN = {
  1 => { "props" => [ "Rubber stamps", "Ink pad", "Cash tin", "Transistor radio", "Hand-painted LAST CROSSING sign" ], "costumes" => [ "Mira's oversized windbreaker" ], "locations" => [ "Kalidhar Island pier" ], "sfx" => [ "Fog" ], "extras" => [ "Gull" ] },
  2 => { "props" => [ "Thermos", "Council letter", "Photo of young Baba" ], "vehicles" => [ "Sea Sparrow ferry" ], "sfx" => [ "Engine cough and stall" ] },
  3 => { "props" => [ "Crate of three chickens", "Tickets", "Exact change" ], "extras" => [ "Queue of islanders" ], "makeup" => [ "Rohan's faint moustache" ] },
  4 => { "props" => [ "Cash tin", "Bucket under the seat" ], "vehicles" => [ "Sea Sparrow ferry" ], "sfx" => [ "Engine stutter" ], "music" => [ "Crossing theme (first statement)" ] },
  5 => { "props" => [ "Council letter", "Council lanyard", "ISLAND EXPRESS banner" ], "vehicles" => [ "Island Express catamaran" ], "extras" => [ "Pigeons", "Terminal commuters" ] },
  6 => { "props" => [ "Pencil co-op offer page", "Coil of rope", "Cash tin" ], "locations" => [ "Sea Sparrow lower hold" ] },
  7 => { "props" => [ "Shopping bags", "Two chickens", "Torch" ], "stunts" => [ "Ferry drifting toward channel markers" ], "sfx" => [ "Full engine failure", "Current drift" ], "extras" => [ "Twenty passengers" ] },
  8 => { "props" => [ "Torch", "Bleed valve", "Eleven spanner" ], "sfx" => [ "Diesel spray", "Starter grinding then catching" ], "makeup" => [ "Diesel on hands and faces" ] },
  9 => { "props" => [ "Drum", "Better drum", "Cash tin", "Council letter" ], "extras" => [ "Whole island on deck" ], "music" => [ "Deck drums", "Crossing theme (full)" ], "sfx" => [ "Golden hour light" ] },
  10 => { "props" => [ "Kitchen knife", "Zip ties", "LAST CROSSING sign (blank side)" ], "sfx" => [ "Engine idle" ], "extras" => [ "Gull" ], "music" => [ "End theme" ] }
}.freeze

# Changes applied to the second draft so revision marks and comparison have something to show.
DRAFT_TWO_CHANGES = {
  2 => ->(elements) { elements.map { |e| e["text"] == "Forty-one years. She knows." ? e.merge("text" => "Forty-one years. She knows, Mira.") : e } },
  6 => ->(elements) { elements + [ { "type" => "action", "text" => "Behind her, through the hatch, the catamaran's wake slaps the hull." } ] },
  10 => ->(elements) { elements.reject { |e| e["text"] == "The gull lands on the blank sign. Considers it. Leaves it alone." } }
}.freeze

ActiveRecord::Base.transaction do
  project = Project.find_or_create_by!(company_id: company.id, title: PROJECT_TITLE) do |p|
    p.created_by_user_id = user.id
    p.project_type = "Short"
    p.status = "active"
    p.description = "A short drama about a father, a daughter, and the 41-year-old ferry the council wants scrapped. Sample project seeded for the script editor."
  end

  existing = project.scripts.find_by(title: SCRIPT_TITLE)
  if existing && ENV["SEED_FORCE"] != "1"
    # Backfill: the editor edits the plain-text `content`; make sure every seeded scene has it.
    backfilled = 0
    existing.script_versions.find_each do |v|
      v.scenes.where(content: [ nil, "" ]).find_each do |sc|
        next if sc.elements.blank?
        sc.update!(content: sc.elements_as_text)
        backfilled += 1
      end
    end
    # Backfill breakdown tags on the first draft where none were tagged yet.
    first = existing.script_versions.order(:version_number).first
    tagged = 0
    first&.scenes&.ordered&.each do |sc|
      next if (sc.metadata || {})["breakdown"].present?
      tags = BREAKDOWN[sc.scene_number]
      next unless tags
      sc.update!(metadata: (sc.metadata || {}).merge("breakdown" => tags))
      tagged += 1
    end

    # Add the second draft if the script still has only one.
    drafted = nil
    if existing.script_versions.count == 1 && first
      drafted = Screenplay::VersionCloner.new(existing, source_version: first, notes: "Second draft. Baba's line in the wheelhouse, a beat in the hold, trimmed ending.").call
      drafted.scenes.ordered.each do |sc|
        change = DRAFT_TWO_CHANGES[sc.scene_number]
        sc.update!(elements: change.call(sc.elements)) if change
      end
    end

    puts "Script '#{SCRIPT_TITLE}' already exists for #{email} (script ##{existing.id}); backfilled content on #{backfilled} scene(s), breakdown tags on #{tagged}#{drafted ? ", added second draft ##{drafted.id}" : ""}. Set SEED_FORCE=1 to replace."
  else
    existing&.destroy!
    script = project.scripts.create!(
      title: SCRIPT_TITLE,
      script_type: "screenplay",
      status: "active",
      created_by_user_id: user.id,
      description: "Short film, ~18 pages. Kalidhar Island's only ferry makes its final crossing - unless its captain can be talked into letting go of the wheel without letting go of the boat."
    )
    version = script.script_versions.create!(version_number: 1, notes: "First draft. Ten scenes, three acts.")

    SCENES.each_with_index do |scene, idx|
      elements = build_elements(scene[:text])
      sc = version.scenes.build(
        scene_number: idx + 1,
        order: idx + 1,
        elements: elements,
        metadata: scene[:meta].merge(
          "location" => elements.first["text"].sub(/\A(INT\.|EXT\.|INT\.\/EXT\.)\s+/, "").sub(/\s+-\s+[^-]+\z/, ""),
          "breakdown" => BREAKDOWN.fetch(idx + 1, {})
        )
      )
      # The script editor edits plain-text `content`; `elements` is the structured form.
      sc.content = sc.elements_as_text
      sc.save!
    end

    # Second draft: a copy of the first with three real revisions.
    draft = Screenplay::VersionCloner.new(script, source_version: version, notes: "Second draft. Baba's line in the wheelhouse, a beat in the hold, trimmed ending.").call
    draft.scenes.ordered.each do |sc|
      change = DRAFT_TWO_CHANGES[sc.scene_number]
      sc.update!(elements: change.call(sc.elements)) if change
    end

    puts "Seeded project ##{project.id} '#{PROJECT_TITLE}' / script ##{script.id} / version ##{version.id} with #{version.scenes.count} scenes for #{email} (+ second draft ##{draft.id})"
    puts "Characters: #{version.scenes.flat_map(&:character_names).uniq.sort.join(', ')}"
  end
end
