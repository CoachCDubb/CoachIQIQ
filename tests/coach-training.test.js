const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function harness(){
  let user='coach-a',program='program-a',role='Assistant Coach',configured=true;
  const stores={},locks={acquired:0,released:0};
  const context=vm.createContext({getCurrentStaffAccess_:()=>({configured,role}),Session:{getActiveUser:()=>({getEmail:()=>user})},SpreadsheetApp:{getActive:()=>({getId:()=>program})},PropertiesService:{getUserProperties:()=>({getProperty:k=>(stores[user]||{})[k]||null,setProperty:(k,v)=>{(stores[user]||(stores[user]={}))[k]=v;}})},LockService:{getUserLock:()=>({waitLock:()=>locks.acquired++,releaseLock:()=>locks.released++})}});
  vm.runInContext(fs.readFileSync('CoachTrainingService.gs','utf8'),context);
  return {context,locks,user:v=>user=v,program:v=>program=v,role:v=>role=v};
}
function submission(extra={}){return Object.assign({lessonId:'offense-1',choice:0,reasoning:'Use the open short roller and read the low defender.',attemptId:'attempt_123456'},extra);}
test('curriculum has six tracks, eighteen unique lessons, and no answer leakage before submission',()=>{
  const {context:c}=harness(),w=c.getCoachTrainingWorkspace();assert.equal(w.modules.length,6);assert.equal(w.lessons.length,18);assert.equal(new Set(w.lessons.map(l=>l.id)).size,18);
  for(const l of w.lessons){const lesson=c.getCoachTrainingLesson(l.id);assert.equal(lesson.options.length,4);assert.deepEqual(Array.from(lesson.options.map(o=>o.id)).sort(),[0,1,2,3]);assert.ok(lesson.scenario.length>80);assert.ok(lesson.reflection);assert.ok(lesson.options.every(o=>o.score===undefined&&o.feedback===undefined));}
});
test('server grades choices, saves reasoning and supplies all teaching feedback',()=>{
  const {context:c,locks}=harness(),r=c.submitCoachTrainingAttempt(submission({score:999}));assert.equal(r.progress.latestScore,100);assert.equal(r.progress.attempts,1);assert.ok(r.practice&&r.measure&&r.feedback);assert.equal(r.options.length,4);assert.equal(c.getCoachTrainingWorkspace().progress['offense-1'].reasoning,submission().reasoning);assert.equal(locks.acquired,locks.released);
});
test('retrying a saved request does not inflate attempts or replace its answer',()=>{
  const {context:c}=harness();c.submitCoachTrainingAttempt(submission());const retry=c.submitCoachTrainingAttempt(submission({choice:3}));assert.equal(retry.progress.latestScore,100);assert.equal(retry.progress.attempts,1);
});
test('latest decision and historical best remain distinct',()=>{
  const {context:c}=harness();c.submitCoachTrainingAttempt(submission());const r=c.submitCoachTrainingAttempt(submission({choice:3,attemptId:'attempt_654321'}));assert.equal(r.progress.bestScore,100);assert.equal(r.progress.latestScore,0);assert.equal(r.progress.attempts,2);
});
test('progress is isolated by coach and workbook',()=>{
  const h=harness();h.context.submitCoachTrainingAttempt(submission());h.user('coach-b');assert.equal(Object.keys(h.context.getCoachTrainingWorkspace().progress).length,0);h.user('coach-a');h.program('program-b');assert.equal(Object.keys(h.context.getCoachTrainingWorkspace().progress).length,0);h.program('program-a');assert.equal(h.context.getCoachTrainingWorkspace().progress['offense-1'].attempts,1);
});
test('invalid answers, unknown lessons, short reasoning and invalid request identifiers cannot save',()=>{
  const {context:c}=harness();for(const extra of [{choice:-1},{choice:4},{choice:'0'},{lessonId:'missing'},{reasoning:'short'},{reasoning:'x'.repeat(1201)},{attemptId:'bad'}])assert.throws(()=>c.submitCoachTrainingAttempt(submission(extra)));assert.equal(Object.keys(c.getCoachTrainingWorkspace().progress).length,0);
});
test('unassigned staff and unavailable identities cannot read or submit training',()=>{
  const h=harness();h.role('Unassigned');assert.throws(()=>h.context.getCoachTrainingWorkspace(),/registered staff/);assert.throws(()=>h.context.getCoachTrainingLesson('offense-1'));assert.throws(()=>h.context.submitCoachTrainingAttempt(submission()));h.role('Assistant Coach');h.user('');assert.throws(()=>h.context.getCoachTrainingWorkspace(),/Sign in/);
});
test('storage failures release the user lock',()=>{
  const h=harness();h.context.PropertiesService.getUserProperties=()=>({getProperty:()=>null,setProperty:()=>{throw new Error('Quota exceeded');}});assert.throws(()=>h.context.submitCoachTrainingAttempt(submission()),/Quota exceeded/);assert.equal(h.locks.acquired,h.locks.released);
});
test('simulations branch on decisions, reject stale rounds and complete three steps',()=>{
  const h=harness(),c=h.context;c.Utilities={getUuid:()=> 'simulation-123'};
  const first=c.startCoachTrainingSimulation();assert.equal(first.round,0);
  const submit=(round,choice)=>c.submitCoachTrainingSimulation({sessionId:first.sessionId,round,choice,reasoning:'Name the role, communicate the coverage and check the next possession.'});
  const a=submit(0,3);assert.equal(a.next.round,1);assert.match(a.next.lesson.scenario,/anticipates/);
  const replay=submit(0,0);assert.equal(replay.answer.score,0);assert.equal(replay.next.round,1);
  assert.throws(()=>submit(2,0),/no longer active/);
  submit(1,0);const done=submit(2,0);assert.equal(done.next.completed,true);assert.equal(done.next.answers.length,3);assert.equal(done.next.score,67);
});
test('simulation progress cannot be read or submitted by another coach or workbook',()=>{
  const h=harness(),c=h.context;c.Utilities={getUuid:()=> 'simulation-123'};const first=c.startCoachTrainingSimulation();h.user('coach-b');assert.throws(()=>c.submitCoachTrainingSimulation({sessionId:first.sessionId,round:0,choice:0,reasoning:'A valid coaching decision and an explanation.'}),/replaced/);
});
test('actual game cases use recorded labels without inventing possession context and recheck access',()=>{
  const h=harness(),c=h.context;let permitted=true;
  c.Utilities={getUuid:()=> 'case-123'};c.requireStaffCapability_=()=>{};c.getCompletedLiveGames_=()=>permitted?[{gameId:'g1',team:'Varsity',opponent:'Visitors',gameDate:'2026-10-14'}]:[];
  c.findLiveGameRecord_=()=>({game:{Team:'Varsity',Sport:'Basketball','Final Report':'report'}});c.requireLiveGameTeamAccess_=()=>{};c.parseLiveGameObject_=()=>({objectives:[{label:'Rebounds',outcome:'Missed'}]});
  const l=c.getCoachTrainingGameCase('g1');assert.match(l.scenario,/Rebounds: Missed/);assert.match(l.scenario,/No clock/);assert.equal(l.options[0].score,undefined);
  const r=c.submitCoachTrainingAttempt(submission({lessonId:l.id}));assert.equal(r.progress.latestScore,100);assert.match(r.feedback,/Summary outcomes/);
  permitted=false;assert.throws(()=>c.submitCoachTrainingAttempt(submission({lessonId:l.id,attemptId:'attempt_again'})),/accessible/);
});
