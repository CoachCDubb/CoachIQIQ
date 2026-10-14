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
