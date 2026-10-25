const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const client=fs.readFileSync('Scripts.html','utf8');
function load(names,ctx){vm.createContext(ctx);for(const name of names){const start=client.indexOf('function '+name+'(');assert.ok(start>=0);const asyncStart=client.slice(start-6,start)==='async '?start-6:start;const end=client.indexOf('\nfunction ',start+1);vm.runInContext(client.slice(asyncStart,end<0?undefined:end),ctx);}return ctx;}
function service(){const ctx={formatLiveGameTimestamp_:String};vm.createContext(ctx);vm.runInContext(fs.readFileSync('GameService.gs','utf8'),ctx);vm.runInContext(fs.readFileSync('AnalyticsService.gs','utf8'),ctx);ctx.formatLiveGameTimestamp_=String;ctx.Utilities={getUuid:()=> '12345678-1234-1234'};return ctx;}
for(const checkpointType of ['Timeout','End Quarter'])test(checkpointType+' succeeds with no objective list and retains the possession report',()=>{
 const ctx=service(),tracker={game:{gameId:'g',team:'Varsity',opponent:'Visitors',currentPeriod:1,format:'Quarters',analyticsEnabled:true},analytics:{offense:{possessions:2,points:2,ppp:1},defense:{possessions:2,points:2,ppp:1},possessionLog:[{points:2}]}};
 let released=false,advanced=false,saved;
 Object.assign(ctx,{requireStaffCapability_:()=>{},initializeLiveGameSheets_:()=>{},requireLiveGameTeamAccess_:()=>{},findLiveGameRecord_:()=>({game:{Team:'Varsity'}}),getLiveGameTracker:()=>tracker,Utilities:{getUuid:()=> '12345678-1234-1234'},LockService:{getScriptLock:()=>({waitLock:()=>{},releaseLock:()=>{released=true;}})},SpreadsheetApp:{getActive:()=>({getSheetByName:()=>({appendRow:row=>{saved=row;}})})},updateLiveGameObjectiveState_:()=>{advanced=true;}});
 const result=ctx.createLiveGameCheckpoint('g',checkpointType);assert.equal(result.report.objectives.length,0);assert.equal(result.report.analytics.possessionLog.length,1);assert.equal(saved[6],'[]');assert.equal(released,true);assert.equal(advanced,checkpointType==='End Quarter');
});
test('scoring tags persist and aggregate once per possession per team',()=>{
 const ctx=service();const item=ctx.cleanLiveAnalyticsPossession_({teamSide:'offense',points:2,playEvents:[{type:'cut'},{type:'cut'},{type:'ato'},{type:'customTag',label:'Horns'},{type:'made2',jersey:'12'}]},1);
 const second=ctx.cleanLiveAnalyticsPossession_({teamSide:'defense',points:3,playEvents:[{type:'customTag',label:'Horns'},{type:'made3',jersey:'4'}]},1);
 const summary=ctx.buildLiveAnalyticsSummary_([item,second],1);const cut=summary.scoringTags.find(t=>t.label==='Cut');assert.equal(cut.possessions,1);assert.equal(cut.points,2);assert.equal(summary.scoringTags.filter(t=>t.label==='Horns').length,2);assert.equal(item.playEvents[3].label,'Horns');
 assert.throws(()=>ctx.cleanLiveAnalyticsPlayEvents_([{type:'customTag',label:''}],'offense'),/1–40/);
});
test('roster credit follows the possession side and uses our player for defensive deflections',()=>{
 let role='offense';const inputs={livePlayOurPlayer:{value:'12'},livePlayOpponentPlayer:{value:'4'},livePlayJersey:{value:'99'}};
 const ctx=load(['liveAnalyticsPlayEvent_'],{document:{getElementById:id=>inputs[id]},getLiveAnalyticsRole_:()=>role,showToast:()=>assert.fail('unexpected validation')});
 assert.equal(ctx.liveAnalyticsPlayEvent_('made2').jersey,'12');role='defense';assert.equal(ctx.liveAnalyticsPlayEvent_('made2').jersey,'4');assert.equal(ctx.liveAnalyticsPlayEvent_('deflection').jersey,'12');inputs.livePlayOpponentPlayer.value='';assert.equal(ctx.liveAnalyticsPlayEvent_('made2').jersey,'99');
});
test('quoted CSV roster names retain commas',()=>{
 const ctx=load(['parseLiveGameOpponentRoster_'],{});const players=ctx.parseLiveGameOpponentRoster_('12,"Smith, Jordan",Guard,12');assert.equal(players[0].jersey,'12');assert.equal(players[0].name,'Smith, Jordan');
});
test('CSV file import drops the header and validates the loaded roster',async()=>{
 const field={value:''};let parsed=false;const ctx=load(['importLiveOpponentRosterFile_'],{document:{getElementById:()=>field},previewLiveGameOpponentRoster:()=>{parsed=true;},showToast:()=>assert.fail('unexpected upload error')});
 const input={files:[{size:50,text:async()=> '\uFEFF"Jersey",Name,Position,Grade\n12,Jordan,Guard,12'}],value:'file.csv'};await ctx.importLiveOpponentRosterFile_(input);assert.equal(parsed,true);assert.equal(field.value,'12,Jordan,Guard,12');assert.equal(input.value,'');
});
test('roster lists show player names, retain selections on refresh and clear them for a different game',()=>{
 const selects={livePlayOurPlayer:{dataset:{},value:'',innerHTML:''},livePlayOpponentPlayer:{dataset:{},value:'',innerHTML:''}};const ctx=load(['renderLivePlayRosters_'],{document:{getElementById:id=>selects[id]},escapeHtmlValue:String});
 const tracker={game:{gameId:'g'},players:[{jersey:'12',firstName:'Jordan',lastName:'Smith'}],opponentRoster:[{jersey:'4',name:'Avery'}]};ctx.renderLivePlayRosters_(tracker);assert.match(selects.livePlayOurPlayer.innerHTML,/#12 · Jordan Smith/);assert.match(selects.livePlayOpponentPlayer.innerHTML,/#4 · Avery/);selects.livePlayOurPlayer.value='12';ctx.renderLivePlayRosters_(tracker);assert.equal(selects.livePlayOurPlayer.value,'12');tracker.game.gameId='new';ctx.renderLivePlayRosters_(tracker);assert.equal(selects.livePlayOurPlayer.value,'');
});
