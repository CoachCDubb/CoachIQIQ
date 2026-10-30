import {cleanOfflineObjectives_,cleanOfflineObjectiveEvents_,buildOfflineObjectiveRows_,offlineObjectiveAutomatic_} from './engine.js';
export const clean=cleanOfflineObjectives_;
export const automatic=offlineObjectiveAutomatic_;
export function validateGame(g){g.objectives=clean(g.objectives);g.objectiveEvents=cleanOfflineObjectiveEvents_(g.objectiveEvents,g.objectives,g.period,g.possessions.length);for(const cp of g.reportCheckpoints||[]){if(cp.snapshot?.objectivePlan!=null)cp.snapshot.objectivePlan=clean(cp.snapshot.objectivePlan);if(cp.snapshot?.objectiveEventCount!=null&&(!Number.isInteger(cp.snapshot.objectiveEventCount)||cp.snapshot.objectiveEventCount<0||cp.snapshot.objectiveEventCount>g.objectiveEvents.length))throw Error('Invalid report objective boundary.');}}
export function rows(g){return buildOfflineObjectiveRows_(clean(g.objectives),g.objectiveEvents||[],g.possessions,g.period);}
function editable(g){if(g.status!=='live'||g.transferLocked)throw Error('Game-plan objectives can only change during an unlocked live game.');}
export function add(g,value){editable(g);const o={...value,id:'objective_'+crypto.randomUUID().replace(/-/g,'')};const plan=clean([...(g.objectives||[]),o]);g.objectives=plan;return o.id;}
export function archive(g,id){editable(g);const o=(g.objectives||[]).find(o=>o.id===id);if(!o)throw Error('Choose an objective.');o.active=false;}
export function restore(g,id){editable(g);const o=(g.objectives||[]).find(o=>o.id===id);if(!o)throw Error('Choose an objective.');o.active=true;}
export function tap(g,id,side,amount=1,kind='count'){
 editable(g);const o=(g.objectives||[]).find(o=>o.id===id&&o.active!==false);if(!o)throw Error('Choose an active objective.');if(automatic(o))throw Error('This objective updates from possessions; do not count it twice.');
 const e={id:'OBJEV-'+crypto.randomUUID(),objectiveId:id,side,amount,kind,period:g.period,boundarySequence:g.possessions.length,at:new Date().toISOString(),voided:false},events=[...(g.objectiveEvents||[]),e];
 cleanOfflineObjectiveEvents_(events,g.objectives,g.period,g.possessions.length);g.objectiveEvents=events;
}
export function undo(g){editable(g);const e=(g.objectiveEvents||[]).findLast(e=>!e.voided);if(e)e.voided=true;}
