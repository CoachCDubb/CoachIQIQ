const fs=require("node:fs");
const path=require("node:path");
const test=require("node:test");
const assert=require("node:assert/strict");
const root=path.join(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");

test("completed games expose a low-work full-film upload flow",()=>{const game=read("Game.html"),scripts=read("Scripts.html");assert.match(game,/Upload the MP4 or MOV you downloaded from Hudl/);assert.match(game,/up to 5 GB/);assert.match(scripts,/openGameFilm/);assert.match(scripts,/uploadSelectedGameFilm/);assert.match(scripts,/uploadGameFilmChunks_/);assert.match(scripts,/function gameFilmMimeType_/);});
test("film upload uses resumable Drive storage rather than spreadsheet blobs",()=>{const service=read("FilmService.gs");assert.match(service,/uploadType=resumable/);assert.match(service,/Content-Range/);assert.match(service,/3\*1024\*1024/);assert.match(service,/Drive File ID/);assert.doesNotMatch(service,/appendRow\([^\n]*base64/);});
test("film endpoints protect completed games and team access",()=>{const service=read("FilmService.gs");assert.match(service,/requireStaffCapability_\("run_sessions"\)/);assert.match(service,/requireLiveGameTeamAccess_/);assert.match(service,/game\.Status\)!=="Completed"/);assert.match(service,/GAME_FILM_MAX_BYTES=5\*1024\*1024\*1024/);});
test("clockless film can be synchronized with one tracked event per period",()=>{const game=read("Game.html"),service=read("FilmService.gs"),scripts=read("Scripts.html");assert.match(game,/Quick Sync uses one known event per period/);assert.match(service,/Sync Markers JSON/);assert.match(service,/function saveGameFilmSync/);assert.match(service,/function buildGameFilmSyncAnchors_/);assert.match(service,/function buildGameFilmTimeline_/);assert.match(scripts,/function openGameFilmSync/);assert.match(scripts,/function parseGameFilmTime_/);assert.match(scripts,/function renderGameFilmTimeline_/);});
test("film sync validates anchors and never requires re-tagging events",()=>{const service=read("FilmService.gs");assert.match(service,/seconds>=0&&seconds<=43200/);assert.match(service,/getLiveGameEvents_\(gameId\)/);assert.match(service,/anchor\+\(eventTime-first\)\/1000/);});
