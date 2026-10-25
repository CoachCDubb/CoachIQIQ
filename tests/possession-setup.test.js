const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('Scripts.html','utf8');
function submit(checked,objectives){
 const elements={liveGameEnableAnalytics:{checked:true},liveGameEnableObjectives:{checked},saveLiveGameSetupButton:{},liveGameOpponent:{value:'Test opponent'},liveGamePeriodLength:{value:'8'}};
 let payload;const runner={withSuccessHandler(){return this;},withFailureHandler(){return this;},createLiveGameSetup(value){payload=value;}};
 const ctx={CoachIQ:{liveGame:{objectives,manualRoster:[]}},document:{getElementById:id=>elements[id]||{value:'Test'},querySelectorAll:selector=>selector.includes('player-check')?[{value:'player1'}]:[]},google:{script:{run:runner}},showToast:()=>assert.fail('Setup should not reject an empty plan')};
 const start=source.indexOf('function submitLiveGameSetup('),end=source.indexOf('\nfunction ',start+1);vm.createContext(ctx);vm.runInContext(source.slice(start,end),ctx);ctx.submitLiveGameSetup({preventDefault(){}});return payload;
}
test('analytics-only setup proceeds even when the empty objectives checkbox is checked',()=>{const payload=submit(true,[]);assert.equal(payload.enableAnalytics,true);assert.equal(payload.enableObjectives,false);assert.equal(payload.trackingObjectives.length,0);});
test('unchecked objectives do not send hidden plan data',()=>{const payload=submit(false,[{id:'objective_test'}]);assert.equal(payload.enableObjectives,false);assert.equal(payload.trackingObjectives.length,0);});
test('explicitly selected objectives are retained',()=>{const payload=submit(true,[{id:'objective_test'}]);assert.equal(payload.enableObjectives,true);assert.equal(payload.trackingObjectives[0].id,'objective_test');});
test('timeout report is outside the objective-only tool group',()=>{const html=fs.readFileSync('Game.html','utf8');const group=html.match(/<span id="liveObjectiveGameTools">([\s\S]*?)<\/span>/)[1];assert.doesNotMatch(group,/Timeout report/);assert.match(html,/createLiveCheckpoint\('Timeout'\)/);});
