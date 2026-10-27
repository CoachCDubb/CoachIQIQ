const TEMPLATE='coachiq-drill-template',SESSION='coachiq-drill-session';
const uuid=prefix=>prefix+crypto.randomUUID(),copy=value=>structuredClone(value);
const text=(value,max,label)=>{const s=String(value??'').trim();if(!s||s.length>max)throw Error(label+' needs 1–'+max+' characters.');return s;};
export const formats={template:TEMPLATE,session:SESSION};
export const starters=[
  {name:'Shooting',folder:'Shooting',successLabel:'Make',failureLabel:'Miss',tags:['Catch & shoot','Off dribble'],defensiveStops:false},
  {name:'Defensive stops',folder:'Defense',successLabel:'Stop',failureLabel:'Score allowed',tags:['Paint touch allowed','OREB allowed','Deflection'],defensiveStops:true},
  {name:'3-on-3 advantage',folder:'Advantage',successLabel:'Score',failureLabel:'Empty trip',tags:['Paint touch','OREB','Turnover'],defensiveStops:false}
];
export function template(input){
 const tags=Array.isArray(input.tags)?input.tags.map(t=>text(t,30,'Tag')):[];
 if(tags.some(t=>['prototype',...Object.getOwnPropertyNames(Object.prototype).map(key=>key.toLowerCase())].includes(t.toLowerCase())))throw Error('Choose a different tag name.');
 if(tags.length>4||new Set(tags.map(t=>t.toLowerCase())).size!==tags.length)throw Error('Choose up to four different tags.');
 const successLabel=text(input.successLabel,30,'Success label'),failureLabel=text(input.failureLabel,30,'Other outcome label');
 if(successLabel.toLowerCase()===failureLabel.toLowerCase())throw Error('The two outcomes need different labels.');
 return {id:uuid('DRILL-'),format:TEMPLATE,schema:1,name:text(input.name,80,'Drill name'),folder:text(input.folder||'General',60,'Folder'),successLabel,failureLabel,tags,defensiveStops:input.defensiveStops===true,createdAt:new Date().toISOString()};
}
export function roster(value){
 const rows=String(value||'').split(/\r?\n/).map(s=>s.trim()).filter(Boolean);if(rows.length>60)throw Error('A drill roster can have up to 60 players.');
 const seen=new Set();return rows.map(row=>{const parts=row.split(','),jersey=parts.shift().trim().replace(/^#/,'');if(!/^\d{1,3}$/.test(jersey)||seen.has(jersey))throw Error('Use a unique jersey number on each roster line.');seen.add(jersey);return{jersey,name:text(parts.join(',').trim()||'#'+jersey,80,'Player name')};});
}
export function session(t,input){
 validateTemplate(t);const players=input.players||[];validateRoster(players);
 return {id:uuid('DRUN-'),format:SESSION,schema:1,templateId:t.id,template:copy(t),team:text(input.team,80,'Team'),players:copy(players),startedAt:new Date().toISOString(),finishedAt:null,status:'active',reps:[],draft:{tags:{},jersey:'',history:[]}};
}
function active(s){if(s.status!=='active')throw Error('This drill session is finished. Start a new session to record more reps.');}
export function selectPlayer(s,jersey){active(s);if(jersey&&!s.players.some(p=>p.jersey===jersey))throw Error('Choose a player on this drill roster.');s.draft.jersey=jersey;}
export function tag(s,label){active(s);if(!s.template.tags.includes(label))throw Error('Choose a tracked drill tag.');if((s.draft.tags[label]||0)>=100)throw Error('Maximum 100 of one tag per rep.');s.draft.tags[label]=(s.draft.tags[label]||0)+1;s.draft.history.push(label);}
export function outcome(s,success){active(s);if(typeof success!=='boolean')throw Error('Choose an outcome.');if(s.reps.length>=5000)throw Error('Finish this session and start another; the limit is 5,000 reps.');s.reps.push({id:uuid('DREP-'),success,jersey:s.draft.jersey,tags:copy(s.draft.tags),tagOrder:copy(s.draft.history),at:new Date().toISOString()});s.draft.tags={};s.draft.history=[];}
export function undo(s){active(s);if(s.draft.history.length){const key=s.draft.history.pop();if(--s.draft.tags[key]===0)delete s.draft.tags[key];return;}const rep=s.reps.pop();if(rep)s.draft={tags:copy(rep.tags),jersey:rep.jersey,history:copy(rep.tagOrder)};}
export function finish(s){active(s);if(Object.keys(s.draft.tags).length)throw Error('Record the current rep’s outcome or undo its tags before finishing.');s.status='completed';s.finishedAt=new Date().toISOString();}
export function stats(s){
 const result={opportunities:s.reps.length,successes:0,rate:null,bestStreak:0,currentStreak:0,kills:0,tags:{},players:[]};
 const players=new Map();for(const rep of s.reps){if(rep.success){result.successes++;result.currentStreak++;result.bestStreak=Math.max(result.bestStreak,result.currentStreak);if(s.template.defensiveStops&&result.currentStreak%3===0)result.kills++;}else result.currentStreak=0;
 for(const label of s.template.tags){const t=result.tags[label]||(result.tags[label]={events:0,reps:0,successes:0});const count=rep.tags[label]||0;t.events+=count;if(count){t.reps++;if(rep.success)t.successes++;}}
 if(rep.jersey){let p=players.get(rep.jersey);if(!p){p={jersey:rep.jersey,name:s.players.find(p=>p.jersey===rep.jersey)?.name||'#'+rep.jersey,opportunities:0,successes:0};players.set(rep.jersey,p);}p.opportunities++;if(rep.success)p.successes++;}
 }result.rate=result.opportunities?result.successes/result.opportunities:null;result.players=[...players.values()].sort((a,b)=>Number(a.jersey)-Number(b.jersey));return result;
}
export function progress(records,s){
 const sessions=records.filter(r=>r.format===SESSION&&r.status==='completed'&&r.templateId===s.templateId&&r.team===s.team).sort((a,b)=>Date.parse(b.startedAt)-Date.parse(a.startedAt)||b.id.localeCompare(a.id));
 const sum=items=>items.reduce((a,r)=>{const v=stats(r);a.sessions++;a.opportunities+=v.opportunities;a.successes+=v.successes;a.rate=a.opportunities?a.successes/a.opportunities:null;return a;},{sessions:0,opportunities:0,successes:0,rate:null});
 return {recent:sum(sessions.slice(0,5)),previous:sum(sessions.slice(5,10))};
}
function validId(value,prefix){return new RegExp('^'+prefix+'[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$','i').test(String(value));}
function date(value){return typeof value==='string'&&Number.isFinite(Date.parse(value));}
function validateTemplate(t){
 if(!t||t.format!==TEMPLATE||t.schema!==1||!validId(t.id,'DRILL-'))throw Error('Invalid drill template.');
 if(['name','folder','successLabel','failureLabel'].some(key=>typeof t[key]!=='string')||!Array.isArray(t.tags)||t.tags.some(tag=>typeof tag!=='string')||typeof t.defensiveStops!=='boolean')throw Error('Invalid drill definition.');
 template({...t});if(!date(t.createdAt))throw Error('Invalid drill creation date.');
}
function validateRoster(players){if(!Array.isArray(players)||players.length>60)throw Error('Invalid drill roster.');const seen=new Set();for(const p of players){if(!p||!/^\d{1,3}$/.test(p.jersey)||seen.has(p.jersey))throw Error('Invalid drill roster number.');text(p.name,80,'Player name');seen.add(p.jersey);}}
export function validate(record){
 if(record?.format===TEMPLATE){validateTemplate(record);return;}
 if(!record||record.format!==SESSION||record.schema!==1||!validId(record.id,'DRUN-'))throw Error('Invalid drill session.');
 validateTemplate(record.template);if(record.templateId!==record.template.id)throw Error('Invalid drill template reference.');text(record.team,80,'Team');validateRoster(record.players);
 if(!['active','completed'].includes(record.status)||!date(record.startedAt)||(record.status==='completed'&&!date(record.finishedAt)))throw Error('Invalid drill session status or date.');
 if(!Array.isArray(record.reps)||record.reps.length>5000)throw Error('Invalid drill repetitions.');
 const ids=new Set();for(const r of record.reps){if(!validId(r.id,'DREP-')||ids.has(r.id)||typeof r.success!=='boolean'||!date(r.at))throw Error('Invalid drill rep.');ids.add(r.id);validateRep(r,record);validateOrder(r.tagOrder,r.tags);}
 if(!record.draft)throw Error('Invalid drill draft.');validateRep(record.draft,record);validateOrder(record.draft.history,record.draft.tags);
 if(record.status==='completed'&&Object.keys(record.draft.tags).length)throw Error('A finished session cannot have unfinished rep tags.');
}
function validateRep(r,s){if(typeof r.jersey!=='string'||(r.jersey&&!s.players.some(p=>p.jersey===r.jersey)))throw Error('Invalid credited player.');if(!r.tags||Array.isArray(r.tags)||typeof r.tags!=='object')throw Error('Invalid rep tags.');for(const [key,count] of Object.entries(r.tags))if(!s.template.tags.includes(key)||!Number.isInteger(count)||count<1||count>100)throw Error('Invalid rep tag count.');}
export function archive(records,folder=''){const chosen=records.filter(r=>!folder||(r.format===TEMPLATE?r.folder:r.template.folder)===folder);if(chosen.length>2000)throw Error('Export one folder at a time; a backup can contain up to 2,000 records.');const packet={format:'coachiq-drill-library',schema:1,exportedAt:new Date().toISOString(),records:chosen.map(copy)};if(new Blob([JSON.stringify(packet)]).size>8*1024*1024)throw Error('Export a smaller folder or individual session; backups are limited to 8 MB.');return packet;}
export function readArchive(packet){if(packet?.format!=='coachiq-drill-library'||packet.schema!==1||!Array.isArray(packet.records)||packet.records.length>2000)throw Error('Choose a GameDay drill-library backup with up to 2,000 records.');const seen=new Set();return packet.records.map(r=>{validate(r);if(seen.has(r.id))throw Error('Duplicate record in drill backup.');seen.add(r.id);return copy(r);});}

function validateOrder(order,tags){if(!Array.isArray(order)||order.length>400)throw Error('Invalid drill action order.');const counts=new Map();for(const label of order){if(typeof label!=='string'||!Object.hasOwn(tags,label))throw Error('Invalid drill action order.');counts.set(label,(counts.get(label)||0)+1);}if(Object.entries(tags).some(([label,count])=>counts.get(label)!==count))throw Error('Invalid drill action order.');}
