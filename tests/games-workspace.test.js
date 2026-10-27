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
