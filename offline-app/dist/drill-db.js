import {validate as validateDrill} from './drills.js';
let connection;
export function openDrillDB(){
 if(connection)return connection;
 connection=new Promise((resolve,reject)=>{const req=indexedDB.open('coachiq-gameday-drills-v1',1);
 req.onupgradeneeded=()=>req.result.createObjectStore('records',{keyPath:'id'});
 req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>{db.close();connection=null;};resolve(db);};
 req.onerror=()=>{connection=null;reject(req.error);};req.onblocked=()=>{connection=null;reject(Error('Close the other GameDay tab and reopen the drill library.'));};});return connection;
}
export async function getDrillRecord(id){const db=await openDrillDB();return new Promise((resolve,reject)=>{const req=db.transaction('records','readonly').objectStore('records').get(id);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}

const isDrill=r=>(r?.format==='coachiq-drill-template'&&String(r.id).startsWith('DRILL-'))||(r?.format==='coachiq-drill-session'&&String(r.id).startsWith('DRUN-'));
const drillId=id=>/^(DRILL|DRUN)-[a-f0-9-]{36}$/i.test(String(id));
export async function listDrillRecords(){const db=await openDrillDB();return new Promise((resolve,reject)=>{const req=db.transaction('records','readonly').objectStore('records').getAll();req.onsuccess=()=>resolve(req.result.filter(isDrill));req.onerror=()=>reject(req.error);});}
export async function putDrillRecord(record,expectedRevision){
 validateDrill(record);
 if(!isDrill(record)||!drillId(record.id)||!Number.isInteger(expectedRevision)||expectedRevision<0)throw Error('Invalid saved drill record.');
 const db=await openDrillDB();return new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite'),store=tx.objectStore('records'),req=store.get(record.id),saved={...record,revision:expectedRevision+1,updatedAt:new Date().toISOString()};let reason;
 req.onsuccess=()=>{const current=req.result;if((current?.revision||0)!==expectedRevision||(current&&!isDrill(current))){reason=Error('This drill changed in another tab. Reopen it before recording more reps.');tx.abort();return;}try{store.put(saved);}catch(e){reason=e;tx.abort();}};
 tx.oncomplete=()=>resolve(saved);tx.onabort=()=>reject(reason||tx.error||Error('Drill was not saved. The previous saved session is intact.'));tx.onerror=()=>{};
 });
}
export async function deleteDrillRecord(id,revision){
 if(!drillId(id))throw Error('Choose a saved drill record.');const db=await openDrillDB();return new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite'),store=tx.objectStore('records'),req=store.get(id);let reason;
 req.onsuccess=()=>{if(!req.result)return;if(!isDrill(req.result)||req.result.revision!==revision){reason=Error('This drill changed in another tab. Reload before deleting.');tx.abort();return;}store.delete(id);};tx.oncomplete=()=>resolve();tx.onabort=()=>reject(reason||tx.error);tx.onerror=()=>{};
 });
}
export async function importDrillRecords(records){
 for(const record of records)validateDrill(record);
 if(records.length>2000||records.some(r=>!isDrill(r)||!drillId(r.id))||new Set(records.map(r=>r.id)).size!==records.length)throw Error('Invalid drill backup records.');
 const db=await openDrillDB();return new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite'),store=tx.objectStore('records');let added=0,skipped=0,reason;
 for(const r of records){const req=store.get(r.id);req.onsuccess=()=>{if(req.result){skipped++;return;}try{store.add({...r,revision:1,updatedAt:new Date().toISOString()});added++;}catch(e){reason=e;tx.abort();}};}
 tx.oncomplete=()=>resolve({added,skipped});tx.onabort=()=>reject(reason||tx.error||Error('Drill import failed; no records were imported.'));tx.onerror=()=>{};
 });
}
