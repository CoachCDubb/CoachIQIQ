const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const scripts=fs.readFileSync('Scripts.html','utf8');
function client(){
 const nav=['Dashboard','Sessions','Game','Scouting','Players','Leaderboard','Staff','AI','Settings','SeasonHistory','CoachTraining'].map(page=>({dataset:{page},hidden:false}));
 const external={hidden:true};const classes=new Set();
 const ctx=vm.createContext({CoachIQ:{programSettings:{workspaceMode:'games'}},document:{body:{classList:{toggle:(name,on)=>on?classes.add(name):classes.delete(name)}},querySelectorAll:s=>s==='#sidebar [data-page]'?nav:s==='[data-games-only]'?[external]:[]}});
 vm.runInContext(scripts.slice(scripts.indexOf('function isGamesWorkspace_()'),scripts.indexOf('function getCoachGreeting(hour)')),ctx);
 return {ctx,nav,external,classes};
}
test('game workspace hides practice and retains game, roster and admin navigation',()=>{const {ctx,nav,external}=client();ctx.applyCoachIQWorkspace_();assert.deepEqual(nav.filter(x=>!x.hidden).map(x=>x.dataset.page),['Dashboard','Game','Scouting','Players','Staff','AI','Settings']);assert.equal(external.hidden,false);});
test('switching back restores features without overriding staff restrictions',()=>{const {ctx,nav,external}=client();nav.find(x=>x.dataset.page==='Staff').dataset.accessDenied='true';ctx.applyCoachIQWorkspace_();ctx.CoachIQ.programSettings.workspaceMode='full';ctx.applyCoachIQWorkspace_();assert.equal(nav.find(x=>x.dataset.page==='Sessions').hidden,false);assert.equal(nav.find(x=>x.dataset.page==='Staff').hidden,true);assert.equal(external.hidden,true);});
test('game home explains file handoff and physical offline reopening test',()=>{const {ctx}=client();const html=ctx.gameWorkspaceHomeHTML_();for(const term of ['Airplane Mode','Wi-Fi off','locked result','jersey numbers','Objectives are optional','https://coachcdubb.github.io/CoachIQIQ/'])assert.ok(html.includes(term),term);assert.ok(!html.includes('Loading...'));});
function settings(){const ctx=vm.createContext({requireStaffCapability_:()=>{},setSettingValues_:x=>ctx.saved=x,getCoachIQSettings:()=>({workspaceMode:ctx.saved['Workspace Mode']})});vm.runInContext(fs.readFileSync('SettingsService.gs','utf8'),ctx);ctx.requireStaffCapability_=()=>{};ctx.setSettingValues_=x=>ctx.saved=x;ctx.splitSettingList_=()=>[];ctx.normalizeThemeColor_=(_,v)=>v;ctx.getPointAwards=()=>[];ctx.getSettingsMap_=()=>ctx.saved||{};return ctx;}
test('workspace preference validates and only writes its setting',()=>{const ctx=settings();assert.equal(ctx.saveCoachIQWorkspaceMode('games').workspaceMode,'games');assert.deepEqual(Object.keys(ctx.saved),['Workspace Mode']);assert.throws(()=>ctx.saveCoachIQWorkspaceMode('invalid'),/valid workspace/);});
test('workspace save requires administrator capability',()=>{const ctx=settings();ctx.requireStaffCapability_=()=>{throw Error('denied');};assert.throws(()=>ctx.saveCoachIQWorkspaceMode('games'),/denied/);assert.equal(ctx.saved,undefined);});
test('older installations default to full workspace',()=>{const ctx=settings();ctx.splitSettingList_=()=>[];ctx.normalizeThemeColor_=(_,v)=>v;ctx.getPointAwards=()=>[];assert.equal(ctx.getCoachIQSettings({}).workspaceMode,'full');});
function pilotFixture(){
 const ctx=settings(),writes=[],reads=[],mutations=[];
 ctx.COACHIQ_REQUIRED_SCHEMA={Players:['Player ID'],Sessions:['Session ID'],'Practice Evaluations':['Player ID'],'Culture Points':['Player ID'],'Audit Log':['Audit ID']};
 ctx.COACHIQ_BUILD_VERSION='test';
 const source={getSheetByName(name){return {getLastColumn:()=>1,getRange(row,col,n,w){reads.push([name,row,n]);return {getValues:()=>[[ctx.COACHIQ_REQUIRED_SCHEMA[name][0]]]};}};}};
 ctx.getCoachIQSpreadsheet_=()=>source;
 function sheet(name){return {setName(value){name=value;},getRange(row,col,n,w){return {setValues(values){writes.push({name,row,values});}};},setFrozenRows(){}};}
 const initial=sheet('Sheet1');
 ctx.SpreadsheetApp={create(name){mutations.push(name);return {getSheets:()=>[initial],insertSheet:sheet,getUrl:()=> 'https://docs.google.com/spreadsheets/d/pilot',getName:()=>name};}};
 return {ctx,writes,reads,mutations};
}
test('pilot workbook reads only header rows and seeds a fresh game-focused setup',()=>{
 const {ctx,writes,reads,mutations}=pilotFixture();const result=ctx.createCoachIQGamePilotWorkbook();
 assert.equal(mutations.length,1);assert.ok(result.url.endsWith('/pilot'));
 assert.equal(reads.length,5);assert.ok(reads.every(x=>x[1]===1&&x[2]===1));
 const saved=writes.find(x=>x.name==='Settings').values;
 assert.equal(saved.find(x=>x[0]==='Setup Complete')[1],'FALSE');assert.equal(saved.find(x=>x[0]==='Workspace Mode')[1],'games');
 assert.ok(!saved.some(x=>['Staff Profiles','School Name','Logo URL','Program Name'].includes(x[0])));
 assert.ok(writes.filter(x=>x.name!=='Settings').every(x=>x.values.length===1));
 assert.ok(writes.some(x=>x.name==='Point Awards'));
});
test('pilot creation rejects broken structure before creating a workbook',()=>{const {ctx,mutations}=pilotFixture();ctx.getCoachIQSpreadsheet_=()=>({getSheetByName:()=>null});assert.throws(()=>ctx.createCoachIQGamePilotWorkbook(),/Missing source structure/);assert.equal(mutations.length,0);});
test('pilot creation requires administrator permission before reading or creating',()=>{const {ctx,reads,mutations}=pilotFixture();ctx.requireStaffCapability_=()=>{throw Error('denied');};assert.throws(()=>ctx.createCoachIQGamePilotWorkbook(),/denied/);assert.equal(reads.length,0);assert.equal(mutations.length,0);});
