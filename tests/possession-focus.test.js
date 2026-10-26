const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const client=fs.readFileSync('Scripts.html','utf8');
function load(names,ctx){vm.createContext(ctx);for(const name of names){const start=client.indexOf('function '+name+'('),end=client.indexOf('\nfunction ',start+1);assert.ok(start>=0);vm.runInContext(client.slice(start,end<0?undefined:end),ctx);}return ctx;}
function server(){const ctx={};vm.createContext(ctx);vm.runInContext(fs.readFileSync('GameService.gs','utf8'),ctx);return ctx;}
test('focus accepts points only, canonical tags and bounded custom choices',()=>{const ctx=server();assert.equal(ctx.cleanLivePossessionFocus_([]).length,0);assert.equal(ctx.cleanLivePossessionFocus_([{type:'cut'}])[0].label,'Cut');assert.equal(ctx.cleanLivePossessionFocus_([{type:'customTag',label:'Horns'}])[0].label,'Horns');assert.throws(()=>ctx.cleanLivePossessionFocus_(Array(7).fill({type:'cut'})),/up to 6/);assert.throws(()=>ctx.cleanLivePossessionFocus_([{type:'made3'}]),/valid/);assert.throws(()=>ctx.cleanLivePossessionFocus_([{type:'customTag',label:''}]),/1–40/);});
function quickTracker(type){let saved;const ctx=load(['emptyLiveAnalyticsDraft_','rememberLiveAnalyticsSelection_','liveAnalyticsPlayEvent_','toggleLiveAnalyticsTag','addLiveAnalyticsPlay_','addLiveAnalyticsRebound','tapLiveFocusTag_','finishLiveAnalyticsPossession'],{CoachIQ:{liveGame:{tracker:{game:{gameId:'g',currentPeriod:1},possessionFocus:[{type,label:type}]},analyticsQueue:[],protectedAnalytics:[]}},document:{getElementById:id=>id==='liveAnalyticsDetails'?{open:false}:null},getLiveAnalyticsRole_:()=> 'offense',liveAnalyticsAutoSwitchEnabled_:()=>true,renderLiveAnalyticsTracker_:()=>{},applyOptimisticLiveAnalyticsPossession_:(tracker,payload)=>{saved=payload;},persistProtectedLiveAnalytics_:()=>{},localStorage:{setItem(){}},setLiveTrackerSaveState:()=>{},liveGamePendingTapCount:()=>1,flushLiveAnalyticsQueue_:()=>{}});ctx.CoachIQ.liveGame.analyticsDraft=ctx.emptyLiveAnalyticsDraft_('offense');return{ctx,saved:()=>saved};}
test('paint touch then 2 saves exactly one possession in two taps with no player selection',()=>{const {ctx,saved}=quickTracker('paintTouch');ctx.tapLiveFocusTag_(0);ctx.finishLiveAnalyticsPossession(2,null,false);assert.equal(ctx.CoachIQ.liveGame.analyticsQueue.length,1);assert.equal(saved().points,2);assert.equal(saved().paintTouch,true);assert.equal(saved().playEvents[0].jersey,'');assert.equal(ctx.CoachIQ.liveGame.analyticsRole,'defense');assert.equal(ctx.CoachIQ.liveGame.analyticsDraft.playEvents.length,0);});
test('OREB then 3 saves one possession and retains actual rebound counts',()=>{const {ctx,saved}=quickTracker('offensiveRebound');ctx.tapLiveFocusTag_(0);ctx.tapLiveFocusTag_(0);ctx.finishLiveAnalyticsPossession(3,null,false);assert.equal(ctx.CoachIQ.liveGame.analyticsQueue.length,1);assert.equal(saved().offensiveRebounds,2);assert.equal(saved().points,3);assert.equal(saved().playEvents.filter(e=>e.type==='offensiveRebound').length,2);});
test('saving game focus preserves tracker options and rejects completed games',()=>{
 const ctx=server();let value,completed=false,released=false;
 const range={setValue(v){value=JSON.parse(v);}};
 const sheet={getRange(){return range;}};
 Object.assign(ctx,{
  requireStaffCapability_:()=>{},initializeLiveGameSheets_:()=>{},requireLiveGameTeamAccess_:()=>{},
  findLiveGameRecord_:()=>({game:{Team:'Varsity',Status:completed?'Completed':'Live','Tracker Mode':'{"analytics":true,"objectives":false}'},rowNumber:2,cols:{'Tracker Mode':9}}),
  LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){released=true;}})},
  SpreadsheetApp:{getActive:()=>({getSheetByName:()=>sheet})}
 });
 ctx.saveLivePossessionFocus('g',[{type:'cut'}]);assert.equal(value.analytics,true);assert.equal(value.objectives,false);assert.equal(value.focus[0].type,'cut');assert.equal(released,true);
 completed=true;assert.throws(()=>ctx.saveLivePossessionFocus('g',[]),/completed game/);
});
test('hidden detailed controls never credit stale selected roster players',()=>{const ctx=load(['liveAnalyticsPlayEvent_'],{getLiveAnalyticsRole_:()=> 'offense',document:{getElementById:id=>id==='liveAnalyticsDetails'?{open:false}:{value:'12'}}});assert.equal(ctx.liveAnalyticsPlayEvent_('made2').jersey,'');});
test('team defaults follow the latest accessible game and preserve points-only choices',()=>{
 const ctx=server(),headers=['Team','Tracker Mode'],rows=[['Varsity','{"focus":[{"type":"paintTouch"}]}'],['JV','{"focus":[{"type":"cut"}]}'],['Varsity','{"focus":[]}']];
 Object.assign(ctx,{SpreadsheetApp:{getActive:()=>({getSheetByName:()=>({getLastRow:()=>4,getDataRange:()=>({getValues:()=>[headers,...rows]})})})},getCurrentStaffAccess_:()=>({configured:true,role:'Assistant',teams:['Varsity']}),filterCoachIQRowsForCurrentSeason_:(headers,values)=>values,isLiveGameArchived_:()=>false});
 const defaults=ctx.getTeamPossessionFocus_();assert.equal(defaults.Varsity.length,0);assert.equal(defaults.JV,undefined);
});
test('focus report counts matching possessions and rebounds without inflating possession totals',()=>{
 const ctx=load(['renderLiveFocusReport_'],{escapeHtmlValue:String,formatCheckpointAnalyticsValue_:v=>v==null?'—':Number(v).toFixed(2)});
 const html=ctx.renderLiveFocusReport_({offense:{possessions:2},defense:{possessions:1},possessionLog:[{teamSide:'offense',offensiveRebounds:2,points:3},{teamSide:'offense',offensiveRebounds:0,points:2},{teamSide:'defense',offensiveRebounds:1,points:0}]},[{type:'offensiveRebound',label:'OREB'}]);
 assert.match(html,/2 offensive \/ 1 defensive possessions/);assert.match(html,/OREB \(2 rebounds\)/);assert.match(html,/<td>Us<\/td><td>1<\/td><td>3<\/td><td>3.00/);
});
