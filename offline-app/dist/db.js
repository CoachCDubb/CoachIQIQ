const NAME='coachiq-gameday-v1';
let connection;
export function openDB(){if(connection)return connection;connection=new Promise((resolve,reject)=>{const req=indexedDB.open(NAME,1);req.onupgradeneeded=()=>req.result.createObjectStore('games',{keyPath:'id'});req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>{db.close();connection=null;};resolve(db);};req.onerror=()=>{connection=null;reject(req.error);};req.onblocked=()=>{connection=null;reject(Error('Close the other CoachIQ GameDay tab and reload.'));};});return connection;}
export async function listGames(){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction('games','readonly'),req=tx.objectStore('games').getAll();req.onsuccess=()=>resolve(req.result.filter(g=>g.format==='coachiq-offline-game').sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)));req.onerror=()=>reject(req.error);});}
export async function getGame(id){const db=await openDB();return new Promise((resolve,reject)=>{const req=db.transaction('games','readonly').objectStore('games').get(id);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
export async function putGame(game,expectedRevision){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction('games','readwrite'),store=tx.objectStore('games'),req=store.get(game.id),value={...game,revision:expectedRevision+1,updatedAt:new Date().toISOString()};let reason;req.onsuccess=()=>{const current=req.result;if((current?current.revision:0)!==expectedRevision){reason=Error('This game changed in another tab. Reload before recording more plays.');tx.abort();return;}try{store.put(value);}catch(error){reason=error;tx.abort();}};tx.oncomplete=()=>resolve(value);tx.onabort=()=>reject(reason||tx.error||Error('The iPad could not save this change. Your previous saved game is intact.'));tx.onerror=()=>{};});}

export async function getTeamLink(){return (await getGame('TEAM-LINK'))||null;}
export async function putTeamLink(link){const previous=await getTeamLink();return putGame({...link,id:'TEAM-LINK'},previous?.revision||0);}

export async function deleteGame(id,expectedRevision){
  if(!/^OFFGAME-[a-f0-9-]{36}$/i.test(String(id))||!Number.isInteger(expectedRevision)||expectedRevision<1)throw Error('Choose a saved GameDay game to delete.');
  const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction('games','readwrite'),store=tx.objectStore('games'),req=store.get(id);let reason,deleted=false;
    req.onsuccess=()=>{const current=req.result;if(!current)return;if(current.format!=='coachiq-offline-game'){reason=Error('Only saved games can be deleted here.');tx.abort();return;}if(current.revision!==expectedRevision){reason=Error('This game changed in another tab. Reload the game list before deleting it.');tx.abort();return;}store.delete(id);deleted=true;};
    tx.oncomplete=()=>resolve(deleted);tx.onabort=()=>reject(reason||tx.error||Error('The game could not be deleted.'));tx.onerror=()=>{};
  });
}
