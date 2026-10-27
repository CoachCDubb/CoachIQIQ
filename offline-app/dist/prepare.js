const ASSETS=['./','./index.html','./style.css','./app.js','./model.js','./insights.js','./drills.js','./drill-ui.js','./drill-db.js','./db.js','./prepare.js','./print.js','./engine.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./build.json'];
export async function cacheOfflineFiles({cacheStorage,fetchAsset,baseURL,version,onProgress=()=>{},timeoutMs=15000}){
  if(!cacheStorage)throw Error('This browser does not provide offline file storage. Open GameDay directly in normal Safari browsing.');
  const name='coachiq-gameday-'+version,base=new URL('./',baseURL),cache=await withDeadline(cacheStorage.open(name),'Offline file storage did not respond.',timeoutMs);
  let complete=true;for(const path of ASSETS)if(!(await cache.match(new URL(path,base).href))){complete=false;break;}if(complete)return {files:ASSETS.length,version};
  try{for(let i=0;i<ASSETS.length;i++){const path=ASSETS[i],url=new URL(path,base);url.searchParams.set('coachiq_build',version);onProgress('2 of 3 · Saving app file '+(i+1)+' of '+ASSETS.length+' · '+path.replace('./',''));
    const response=await withDeadline(fetchAsset(url.href,{credentials:'same-origin',cache:'reload'}),'Download timed out for '+path,timeoutMs);
    if(!response.ok)throw Error(path+' returned HTTP '+response.status+'.');
    if(response.url&&new URL(response.url).origin!==base.origin)throw Error(path+' redirected outside GameDay. Sign in to GameDay directly in Safari.');
    const type=response.headers.get('content-type')||'';
    if(path.endsWith('.js')&&!/(javascript|ecmascript)/i.test(type))throw Error(path+' returned '+(type||'an unknown file type')+' instead of JavaScript. A sign-in page may be blocking this file.');
    if((path==='./'||path==='./index.html')&&!(await response.clone().text()).includes('name="coachiq-offline-build" content="'+version+'"'))throw Error(path+' did not return the current GameDay app. Reopen the link directly in Safari and sign in.');
    try{await withDeadline(cache.put(new URL(path,base).href,new Response(response.body,{status:response.status,statusText:response.statusText,headers:response.headers})),'Saving '+path+' timed out.',timeoutMs);}catch(error){throw Error('Could not save '+path+': '+error.message);}
  }}catch(error){await cacheStorage.delete(name);throw error;}
  return {files:ASSETS.length,version};
}
// Keep every installation step bounded: serviceWorker.ready can remain pending forever.
export function withDeadline(promise,message,timeoutMs=15000){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error(message)),timeoutMs);Promise.resolve(promise).then(value=>{clearTimeout(timer);resolve(value);},error=>{clearTimeout(timer);reject(error);});});}
function activatedWorker(registration,container){if(registration.active)return Promise.resolve(registration.active);const worker=registration.installing||registration.waiting;if(!worker)return container.ready.then(r=>r.active);return new Promise((resolve,reject)=>{const changed=()=>{if(worker.state==='activated'||worker.state==='redundant'){worker.removeEventListener('statechange',changed);worker.state==='activated'?resolve(worker):reject(Error('The browser could not install the offline files. The host may have blocked a file or returned a sign-in page.'));}};worker.addEventListener('statechange',changed);changed();});}
export async function prepareOffline({openDB,serviceWorker,storage,uuid,MessageChannel,onProgress=()=>{},timeoutMs=15000,version,cacheStorage=globalThis.caches,fetchAsset=globalThis.fetch,baseURL=globalThis.location?.href}){
  if(!serviceWorker)throw Error('Offline installation is unavailable in this browser. Open the GameDay link directly in Safari, outside ChatGPT or another app.');
  onProgress('1 of 3 · Checking storage on this iPad…');
  const db=await withDeadline(openDB(),'Device storage did not respond. Close other GameDay tabs and try again in normal Safari browsing.',timeoutMs);
  await withDeadline(new Promise((resolve,reject)=>{const tx=db.transaction('games','readwrite'),store=tx.objectStore('games'),key='PROBE-'+uuid();store.put({id:key,revision:0});store.delete(key);tx.oncomplete=resolve;tx.onabort=()=>reject(tx.error||Error('Device storage could not save the test record.'));tx.onerror=()=>{};}),'The storage check did not finish. Close other GameDay tabs and retry.',timeoutMs);
  await cacheOfflineFiles({cacheStorage,fetchAsset,baseURL,version,onProgress,timeoutMs});
  onProgress('2 of 3 · Activating offline app files…');
  const registration=await withDeadline(serviceWorker.register('./sw.js',{scope:'./'}),'The browser did not finish registering the offline app. Open the link directly in Safari and retry while online.',timeoutMs);
  const worker=await withDeadline(activatedWorker(registration,serviceWorker),'The offline worker did not activate. Stay online, reload GameDay directly in Safari, and retry. Offline opening is not ready.',timeoutMs);
  if(!worker)throw Error('No active offline worker was found. Offline opening is not ready.');
  onProgress('3 of 3 · Verifying every saved app file…');
  const channel=new MessageChannel();let result;
  try{result=await withDeadline(new Promise((resolve,reject)=>{channel.port1.onmessage=e=>resolve(e.data);channel.port1.onmessageerror=()=>reject(Error('The offline verification response could not be read.'));worker.postMessage({type:'VERIFY_CACHE'},[channel.port2]);}),'The offline worker did not answer the file check. Keep internet on and retry.',timeoutMs);}finally{channel.port1.close();}
  if(!result?.ready)throw Error('Some offline app files are missing. Keep internet on, reload, and retry. Offline opening is not ready.');
  if(version&&result.version!==version)throw Error('An older offline version is still active. Close every GameDay tab and the Home Screen app, reopen while online, and retry.');
  // Persistence permission is optional; failure cannot erase a completed cache check.
  if(storage?.persist)await withDeadline(storage.persist(),'Persistence request timed out.',2000).catch(()=>false);
  return result;
}
