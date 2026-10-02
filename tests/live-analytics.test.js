const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('analytics stores one canonical row per completed possession', () => {
  const service = read('AnalyticsService.gs');
  assert.match(service, /Live Analytics Possessions/);
  assert.match(service, /recordLiveAnalyticsPossession/);
  assert.match(service, /possessionId/);
  assert.match(service, /offensiveRebounds/);
  assert.match(service, /payload\.turnover === true/);
  assert.match(service, /payload\.forcedTurnover === true/);
  assert.match(service, /requireLiveGameTeamAccess_/);
  assert.match(service, /getScriptLock/);
});

test('tracker uses role-specific tags and a single possession outcome', () => {
  const game = read('Game.html');
  const scripts = read('Scripts.html');
  assert.match(game, /Track Offense/);
  assert.match(game, /Track Defense/);
  assert.match(game, /End possession/);
  assert.match(game, /finishLiveAnalyticsPossession\(3/);
  assert.match(scripts, /Any Right-Hand Drive/);
  assert.match(scripts, /Any Paint Touch Allowed/);
  assert.match(scripts, /recordLiveAnalyticsPossession/);
  assert.match(scripts, /voidLatestLiveAnalyticsPossession/);
});

test('tracker explains possession-level tags and permits rebound correction', () => {
  const game = read('Game.html');
  const scripts = read('Scripts.html');
  assert.match(game, /Half court is the default; tap each tag once if it happened/);
  assert.match(game, /removeLiveAnalyticsRebound/);
  assert.match(scripts, /Any Paint Touch/);
  assert.match(scripts, /aria-pressed/);
  assert.match(scripts, /function removeLiveAnalyticsRebound/);
  assert.match(scripts, /Math\.max\(0,Number\(draft\.offensiveRebounds\|\|0\)-1\)/);
});

test('analytics and objectives are independently optional per game', () => {
  const game = read('Game.html');
  const client = read('Scripts.html');
  const server = read('GameService.gs');
  assert.match(game, /liveGameEnableAnalytics/);
  assert.match(game, /liveGameEnableObjectives/);
  assert.match(game, /Use either tracker, both trackers, or neither/);
  assert.match(client, /enableAnalytics:enableAnalytics/);
  assert.match(client, /enableObjectives:enableObjectives/);
  assert.match(client, /analyticsPanel\.hidden=data\.game\.analyticsEnabled===false/);
  assert.match(client, /objectiveGrid\.hidden=data\.game\.objectivesEnabled===false/);
  assert.match(server, /Tracker Mode/);
  assert.match(server, /buildOptionalTrackerPostgameReport_/);
  assert.doesNotMatch(server, /if \(!trackingPlan\.length && !selectedStats\.length\) throw new Error/);
});

test('summary calculates possession-based decision metrics with null zero denominators', () => {
  const service = read('AnalyticsService.gs');
  assert.match(service, /side\.ppp=liveAnalyticsRate_/);
  assert.match(service, /side\.transitionPpp=liveAnalyticsRate_/);
  assert.match(service, /side\.paintTouchPpp=liveAnalyticsRate_/);
  assert.match(service, /side\.rightHandDrivePpp=liveAnalyticsRate_/);
  assert.match(service, /denominator \? roundLiveAnalytics_\(number \/ denominator\) : null/);
  assert.match(service, /possessionDifference/);

  const context = {};
  vm.runInNewContext(service, context);
  const summary = context.buildLiveAnalyticsSummary_([
    {teamSide:'offense', period:1, points:2, offensiveRebounds:0, transition:true, paintTouch:true},
    {teamSide:'offense', period:1, points:0, offensiveRebounds:1, turnover:true},
    {teamSide:'defense', period:1, points:3, offensiveRebounds:0, transition:true, paintTouch:true, rightHandDrive:true},
  ], 1);
  assert.equal(summary.offense.possessions, 2);
  assert.equal(summary.offense.ppp, 1);
  assert.equal(summary.offense.paintTouchPpp, 2);
  assert.equal(summary.defense.rightHandDrivePpp, 3);
  assert.equal(summary.possessionDifference, 1);
});
