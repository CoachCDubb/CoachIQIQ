const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("Scripts.html", "utf8");
function loadFunction(name) {
  const match = source.match(new RegExp(`function ${name}\\([^\\n]+`));
  assert.ok(match, `${name} should remain directly testable`);
  const context = {};
  vm.createContext(context);
  vm.runInContext(match[0], context);
  return context[name];
}

test("same-action taps are blocked only inside the accidental-tap window", () => {
  const shouldBlock = loadFunction("shouldBlockLiveGameTap_");
  assert.equal(shouldBlock("paint|Us|1", 1200, "paint|Us|1", 1000), true);
  assert.equal(shouldBlock("paint|Us|1", 1350, "paint|Us|1", 1000), false);
  assert.equal(shouldBlock("paint|Us|1", 1100, "turnover|Us|1", 1000), false);
});

test("pending count does not double-count a tap in both queue and protection", () => {
  const pendingCount = loadFunction("liveGamePendingTapCount");
  const context = {liveGame:{tapQueue:[1, 2], protectedTaps:[1, 2]}};
  assert.equal(pendingCount.call(null, context), 2);
});

function loadMultilineFunction(name) {
  const match = source.match(new RegExp(`function ${name}\\([\\s\\S]*?\\n}`));
  assert.ok(match, `${name} should remain directly testable`);
  const context = {};
  vm.createContext(context);
  vm.runInContext(match[0], context);
  return context[name];
}

test("opponent roster paste accepts CSV, tabs, and jersey-name lines", () => {
  const parse = loadMultilineFunction("parseLiveGameOpponentRoster_");
  const players = parse("23, Jordan Lee, Guard, 12\n7\tAvery Smith\tForward\t11\n#4 Casey Jones\nMorgan Reed");
  assert.deepEqual(JSON.parse(JSON.stringify(players.map(({jersey,name,position,grade}) => ({jersey,name,position,grade})))), [
    {jersey:"23",name:"Jordan Lee",position:"Guard",grade:"12"},
    {jersey:"7",name:"Avery Smith",position:"Forward",grade:"11"},
    {jersey:"4",name:"Casey Jones",position:"",grade:""},
    {jersey:"",name:"Morgan Reed",position:"",grade:""}
  ]);
});

test("opponent roster paste rejects duplicate jersey-name pairs", () => {
  const parse = loadMultilineFunction("parseLiveGameOpponentRoster_");
  assert.throws(() => parse("23, Jordan Lee\n23, Jordan Lee"), /duplicates another player/);
});
