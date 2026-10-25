const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const service = fs.readFileSync('AnalyticsService.gs','utf8');
const client = fs.readFileSync('Scripts.html','utf8');
function server(){const ctx={Utilities:{getUuid:()=> '12345678-1234-1234'},parseLiveGameJson_:(value,fallback)=>value?JSON.parse(value):fallback,formatLiveGameTimestamp_:String};vm.createContext(ctx);vm.runInContext(service,ctx);return ctx;}
function functions(names,context){vm.createContext(context);for(const name of names){const start=client.indexOf('function '+name+'(');assert.ok(start>=0);let end=client.indexOf('\nfunction ',start+1);vm.runInContext(client.slice(start,end<0?undefined:end),context);}return context;}

test('miss, rebound and and-one remain one possession with player credit and event order',()=>{
  const ctx=server();
  const item=ctx.cleanLiveAnalyticsPossession_({teamSide:'offense',points:3,paintTouch:true,offensiveRebounds:1,playEvents:[
    {type:'paintTouch',jersey:'4'},{type:'driveKick',jersey:'4'},{type:'miss3',jersey:'7'},
    {type:'offensiveRebound',jersey:'12'},{type:'putback',jersey:'12'},{type:'andOne',jersey:'12'},{type:'made3',jersey:'12'}]},1);
  const summary=ctx.buildLiveAnalyticsSummary_([item],1);
  assert.equal(summary.offense.possessions,1);assert.equal(summary.offense.points,3);assert.equal(summary.offense.offensiveRebounds,1);
  const twelve=summary.playerTotals.find(p=>p.jersey==='12');assert.equal(twelve.offensiveRebounds,1);assert.equal(twelve.points,3);
  assert.equal(summary.possessionLog[0].playEvents.map(e=>e.type).join(','),'paintTouch,driveKick,miss3,offensiveRebound,putback,andOne,made3');
});
test('defense credits our deflections and opponent rebounds separately even with the same jersey',()=>{
  const ctx=server(),item=ctx.cleanLiveAnalyticsPossession_({teamSide:'defense',points:2,offensiveRebounds:1,playEvents:[{type:'deflection',jersey:'12',playerSide:'opponent'},{type:'offensiveRebound',jersey:'12',playerSide:'us'},{type:'made2',jersey:'12'}]},1);
  const totals=ctx.buildLiveAnalyticsSummary_([item],1).playerTotals;
  assert.equal(totals.find(p=>p.playerSide==='us').deflections,1);
  assert.equal(totals.find(p=>p.playerSide==='us').offensiveRebounds,0);
  assert.equal(totals.find(p=>p.playerSide==='opponent').offensiveRebounds,1);
});
test('full report retains more than eight possessions and old rows have no invented player credit',()=>{
  const ctx=server(),items=Array.from({length:15},(_,i)=>({teamSide:'offense',points:2,offensiveRebounds:0,period:i<10?1:2}));
  const summary=ctx.buildLiveAnalyticsSummary_(items,2);
  assert.equal(summary.recent.length,8);assert.equal(summary.possessionLog.length,15);assert.equal(summary.playerTotals.length,0);
  assert.equal(summary.offense.periodPossessions,5);
});
test('invalid events and mismatched rebound totals cannot be persisted',()=>{
  const ctx=server(),base={teamSide:'offense',points:0};
  assert.throws(()=>ctx.cleanLiveAnalyticsPossession_({...base,playEvents:[{type:'arbitrary'}]},1),/valid play/);
  assert.throws(()=>ctx.cleanLiveAnalyticsPossession_({...base,playEvents:[{type:'paintTouch',jersey:'<script>'}]},1),/jersey/);
  assert.throws(()=>ctx.cleanLiveAnalyticsPossession_({...base,playEvents:[{type:'offensiveRebound',jersey:'12'}]},1),/match/);
});
test('selection undo restores a deep snapshot including ordered rebound events',()=>{
  const ctx=functions(['rememberLiveAnalyticsSelection_','undoLiveAnalyticsSelection_'],{CoachIQ:{liveGame:{analyticsDraft:{offensiveRebounds:1,playEvents:[{type:'offensiveRebound',jersey:'12'}]}}},renderLiveAnalyticsTracker_:()=>{},showToast:()=>{}});
  ctx.rememberLiveAnalyticsSelection_();ctx.CoachIQ.liveGame.analyticsDraft.playEvents.push({type:'miss3'});ctx.undoLiveAnalyticsSelection_();
  assert.equal(ctx.CoachIQ.liveGame.analyticsDraft.playEvents.length,1);
});
test('possession persistence round-trips play JSON and old rows without the new column',()=>{
  const ctx=server();const rows=[['LAP-12345678','game',1,'now',1,'offense',3,false,true,false,false,false,1,'staff',false,'Live',JSON.stringify([{type:'offensiveRebound',jersey:'12',playerSide:'us'}])],['LAP-87654321','game',2,'now',1,'defense',0,false,false,false,false,false,0,'staff',false,'Live']];
  ctx.initializeLiveAnalyticsSheet_=()=>({getLastRow:()=>3,getRange:()=>({getValues:()=>rows})});
  const log=ctx.getLiveAnalyticsPossessions_('game');assert.equal(log[0].playEvents[0].jersey,'12');assert.equal(log[1].playEvents.length,0);
});
test('player scoring cannot disagree with the saved possession score',()=>{
  const ctx=server();assert.throws(()=>ctx.cleanLiveAnalyticsPossession_({teamSide:'offense',points:0,playEvents:[{type:'made3',jersey:'12'}]},1),/match total/);
});
test('checkpoint renderer shows the full log, escapes jersey text and distinguishes missing paint samples',()=>{
  const container={innerHTML:''};const ctx=functions(['liveAnalyticsPlayChips_','renderCheckpointPossessionReview_'],{document:{getElementById:()=>container},escapeHtmlValue:s=>String(s).replaceAll('<','&lt;').replaceAll('>','&gt;'),formatCheckpointAnalyticsValue_:n=>n==null?'—':Number(n).toFixed(2)});
  ctx.renderCheckpointPossessionReview_({offense:{possessions:10,points:20,paintTouchPossessions:0},playerTotals:[{jersey:'<12>',offensiveRebounds:2}],possessionLog:Array.from({length:10},()=>({teamSide:'offense',period:1,points:2,playEvents:[{type:'made2',jersey:'12'}]}))},1);
  assert.match(container.innerHTML,/Possession 10/);assert.match(container.innerHTML,/&lt;12&gt;/);assert.match(container.innerHTML,/— PPP with a paint touch/);assert.match(container.innerHTML,/2.00 without/);
});
