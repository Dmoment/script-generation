# Scene editor

The script editor (`app/javascript/components/script-editor/ScreenplayEditor.tsx`)
is a block editor: every screenplay element (scene heading, action, character,
parenthetical, dialogue, transition, centered text, page break) is its own
editable block with industry margins. The structured `elements` array is what
gets saved; the server derives the plain-text `content` and the scene's
`slugline` from it (and the other way round, see `app/models/scene.rb`).

## Keyboard

| Key | Action |
| --- | --- |
| Enter | Finish the element and start the next one (heading → action, character → dialogue, dialogue → action, transition → heading) |
| Shift+Enter | Line break inside the element |
| Tab | On an empty element: change its type. On an element with text: start a new element (action → character, character/dialogue → parenthetical, parenthetical → dialogue) |
| Shift+Tab | Cycle the element type backwards |
| Cmd/Ctrl+1 … 7 | Set the type directly (heading, action, character, parenthetical, dialogue, transition, centered) |
| Backspace at the start | Merge into the previous element (or remove an empty one) |
| Cmd/Ctrl+Z, Shift+Cmd/Ctrl+Z | Undo / redo (keystrokes in one block within a second form one step) |
| Cmd/Ctrl+Enter | Next scene |

Typing `INT.` / `EXT.` in an action block promotes it to a heading; an all-caps
line followed by text becomes a character cue on Enter; `(` at the start of
dialogue turns it into a parenthetical. Character and heading blocks offer
autocomplete from the rest of the script. Multi-line pastes are split into
elements.

## Saving

Changes are saved one second after the last keystroke, when switching scenes
and when leaving the page (`PUT /api/v1/scenes/:id` with `elements`). The status
("Saved", "Unsaved changes", "Saving…") is in the toolbar. Headings, cues and
transitions are stored formatted even if the writer never left the block.

## Export, import, print

The Export menu in the header downloads the version as Final Draft (`.fdx`) or
Fountain, opens a print view (`/scripts/:scriptId/versions/:versionId/print`,
US letter with industry margins, use the browser's "Save as PDF"), and imports
an `.fdx`, `.fountain` or `.txt` file in place of the current scenes. Uploading
one of those files from the dashboard parses it into scenes automatically.
Services live under `app/services/screenplay/`.

## Local QA without Auth0

Start a server with `DEV_AUTH_BYPASS=1` (development or test only) and the app
runs with a stub session as `dev.tester@localhost`; the API accepts
`Authorization: Bearer dev-bypass-token`. See `app/services/dev_auth_bypass.rb`.
Seed that user a sample script with
`SEED_EMAIL=dev.tester@localhost bin/rails runner db/seeds/sample_screenplay.rb`.

## Scene details and breakdown

The right panel edits the scene's index-card fields (act, status, tone,
estimated time, purpose, summary, notes) and the production breakdown: cast is
read from the character cues; extras, props, costumes, makeup, vehicles,
stunts, SPFX/VFX, music and locations are tagged per scene and stored in
`scene.metadata.breakdown`. The Breakdown tab aggregates them for the version
(`GET /api/v1/script_versions/:id/breakdown`, `file_format=csv` for a
spreadsheet). The Characters tab is derived from the cues: scenes, lines, words
and presence per character.

## Drafts, comparison and revision marks

The Drafts menu in the header switches versions, starts a new draft
(`POST /api/v1/scripts/:id/versions` copies every scene and records
`metadata.source_scene_id` lineage) and compares the open draft with an earlier
one (`GET /api/v1/script_versions/:id/compare?with=`). Scenes revised since the
previous draft carry a `*` in the scene list and in the right margin of the
print view (`GET /api/v1/script_versions/:id/revisions`).

## Production numbering, revision colours and comments

The revision bar above the editor locks scene numbers for a draft
(`PUT /api/v1/script_versions/:id/lock_numbers`). Once locked, every scene
keeps its number as `scene_label`; a scene inserted after another gets a
letter (6A, 6B) via `POST /api/v1/scenes` with `after_scene_id`; deleting a
scene keeps it as an OMITTED placeholder; reordering keeps labels. Unlocking
renumbers from 1 and drops placeholders. The revision colour and date
(`PUT /api/v1/script_versions/:id`) print on the title page; a new draft from a
locked draft advances to the next colour in the industry sequence (white, blue,
pink, yellow, green, goldenrod, buff, salmon, cherry, then double colours).

Scene comments (`/api/v1/scenes/:id/comments`) are threads with one level of
replies; threads can be resolved, and only the author can delete a comment.
