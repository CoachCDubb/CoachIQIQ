/** Audited corrections, tactical markers and factual game-review highlights. */
const LIVE_POSSESSION_EDITS_SHEET = "Live Possession Edits";
const LIVE_POSSESSION_EDIT_HEADERS = ["Edit ID","Game ID","Possession ID","Revision","Changed At","Changed By","Reason","Before JSON","After JSON"];
function getLivePossessionEditRows_(gameIds,latestOnly){
  const sheet=SpreadsheetApp.getActive().getSheetByName(LIVE_POSSESSION_EDITS_SHEET);if(!sheet||sheet.getLastRow()<2)return[];
  const ids=new Set(gameIds.map(String)),index=sheet.getRange(2,1,sheet.getLastRow()-1,4).getValues(),selected=[];
  index.forEach(function(row,i){if(ids.has(String(row[1])))selected.push({row:i+2,metadata:row});});
  let needed=selected;if(latestOnly){const latest=Object.create(null);selected.forEach(function(item){const key=JSON.stringify([String(item.metadata[1]),String(item.metadata[2])]);if(!latest[key]||Number(item.metadata[3])>Number(latest[key].metadata[3]))latest[key]=item;});needed=Object.keys(latest).map(function(key){return latest[key];}).sort(function(a,b){return a.row-b.row;});}
  // Read payloads only for matching rows, batching adjacent revisions. Normal tracking
  // never loads every historical before/after JSON value in the workbook.
  const results=[];for(let i=0;i<needed.length;){const start=needed[i].row;let end=start;i++;while(i<needed.length&&needed[i].row===end+1){end=needed[i].row;i++;}Array.prototype.push.apply(results,sheet.getRange(start,1,end-start+1,LIVE_POSSESSION_EDIT_HEADERS.length).getValues());}return results;
}

function applyLivePossessionEdits_(groups){
  const latest=Object.create(null);getLivePossessionEditRows_(Object.keys(groups),true).forEach(function(row){const key=JSON.stringify([String(row[1]),String(row[2])]);if(!latest[key]||Number(row[3])>Number(latest[key][3]))latest[key]=row;});
  Object.keys(groups).forEach(function(gameId){groups[gameId]=groups[gameId].map(function(item){const row=latest[JSON.stringify([gameId,item.possessionId])];if(!row)return Object.assign({},item,{revision:0});
    if(String(row[8]).slice(0,5)!=="json:")throw new Error("A saved possession correction is unreadable.");const after=JSON.parse(String(row[8]).slice(5));
    if(after.possessionId!==item.possessionId||after.teamSide!==item.teamSide)throw new Error("A saved correction does not match its possession.");
    return Object.assign({},item,after,{sequence:item.sequence,timestamp:item.timestamp,revision:Number(row[3]),editedAt:formatLiveGameTimestamp_(row[4])});
  });});
}
function requireLiveReviewGame_(gameId){const record=findLiveGameRecord_(gameId);requireLiveGameTeamAccess_(record.game.Team);if(String(record.game.Status)==="Offline Importing")throw new Error("Finish or retry the staged offline import before reviewing this game.");if(String(record.game["Archive Status"]||"")==="Archived")throw new Error("Archived games cannot be reviewed or changed here.");return record;}
function getLivePossessionForEdit(gameId,possessionId){
  requireStaffCapability_("run_sessions");const record=requireLiveReviewGame_(gameId),item=getLiveAnalyticsPossessions_(gameId).find(function(p){return p.possessionId===String(possessionId);});if(!item)throw new Error("This possession is unavailable or was undone. Refresh the list.");
  const history=getLivePossessionEditRows_([gameId]).filter(function(row){return String(row[2])===String(possessionId);}).map(function(row){return{revision:Number(row[3]),at:formatLiveGameTimestamp_(row[4]),by:String(row[5]),reason:String(row[6]),before:JSON.parse(String(row[7]).slice(5)),after:JSON.parse(String(row[8]).slice(5))};});
  return{possession:item,history:history,completed:String(record.game.Status)==="Completed"};
}
function cleanLivePossessionCorrection_(original,payload){
  payload=payload||{};if(payload.teamSide!==original.teamSide)throw new Error("A correction cannot change the offensive/defensive side.");
  const cleaned=cleanLiveAnalyticsPossession_(Object.assign({},payload,{possessionId:original.possessionId}),original.period);cleaned.possessionId=original.possessionId;
  // Preserve coverage metadata: editing a tag must not manufacture historical negative evidence.
  cleaned.trackedTags=original.trackedTags==null?null:original.trackedTags.slice();return cleaned;
}
function correctLiveAnalyticsPossession(gameId,data){
  requireStaffCapability_("run_sessions");data=data||{};const editId=String(data.editId||""),reason=String(data.reason||"").trim().slice(0,240);if(!/^EDIT-[A-Za-z0-9-]{8,80}$/.test(editId)||!reason)throw new Error("Enter a correction reason and retry.");
  const lock=LockService.getScriptLock();lock.waitLock(10000);let committed=false;
  try{const record=requireLiveReviewGame_(gameId),edits=getLivePossessionEditRows_([gameId]),duplicate=edits.find(function(row){return String(row[0])===editId;});
    if(duplicate&&String(duplicate[2])!==String(data.possessionId))throw new Error("This correction ID belongs to a different possession.");
    if(!duplicate){const original=getLiveAnalyticsPossessions_(gameId).find(function(p){return p.possessionId===String(data.possessionId);});if(!original)throw new Error("This possession was undone or removed. Refresh the list.");
      if(!Number.isInteger(data.expectedRevision)||Number(original.revision||0)!==data.expectedRevision)throw new Error("Someone else corrected this possession. Close and reopen it before saving.");
      const after=cleanLivePossessionCorrection_(original,data.possession),beforeJSON="json:"+JSON.stringify(original),afterJSON="json:"+JSON.stringify(after);if(beforeJSON.length>45000||afterJSON.length>45000)throw new Error("This possession is too large to correct here.");
      const sheet=ensureLiveGameSheet_(LIVE_POSSESSION_EDITS_SHEET,LIVE_POSSESSION_EDIT_HEADERS);sheet.appendRow([editId,String(gameId),original.possessionId,Number(original.revision||0)+1,new Date(),Session.getActiveUser().getEmail()||"",safeLiveGameValue_(reason),beforeJSON,afterJSON]);
    }
    committed=true;record.sheet.getRange(record.rowNumber,record.cols["Updated At"]+1).setValue(new Date());
    const result=getLiveGameReview(gameId);if(result.report.checkpointType==="Postgame"){const stored=compactStoredPostgameReport_(result.report,gameId);record.sheet.getRange(record.rowNumber,record.cols["Final Report"]+1).setValue(JSON.stringify(stored));}return result;
  }catch(error){if(committed)return{saved:true,refreshError:"Correction saved. Reopen the report to refresh it. "+error.message};throw error;}finally{lock.releaseLock();}
}

function markLiveGameAdjustment(gameId,data){
  requireStaffCapability_("run_sessions");data=data||{};const label=String(data.label||"").trim().slice(0,80),id=String(data.adjustmentId||"");if(!label||!/^TACTIC-[A-Za-z0-9-]{8,80}$/.test(id))throw new Error("Name the coaching adjustment.");
  const side=["offense","defense","both"].indexOf(data.side)>=0?data.side:"defense",lock=LockService.getScriptLock();lock.waitLock(10000);
  try{const record=requireLiveReviewGame_(gameId);if(String(record.game.Status)==="Completed")throw new Error("A completed game cannot receive a new adjustment marker.");
    const markers=parseLiveGameJson_(record.game["Plan Adjustments"],[]);if(!markers.some(function(m){return m.adjustmentId===id;})){
      if(markers.filter(function(m){return m.kind==="tactical";}).length>=20)throw new Error("This game already has 20 tactical markers.");
      const sheet=initializeLiveAnalyticsSheet_(),rows=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,3).getValues():[];let boundary=0;rows.forEach(function(row){if(String(row[1])===String(gameId))boundary=Math.max(boundary,Number(row[2]||0));});
      markers.push({kind:"tactical",adjustmentId:id,label:label,side:side,boundarySequence:boundary,period:Number(record.game["Current Period"]||1),changedAt:formatLiveGameTimestamp_(new Date()),changedBy:Session.getActiveUser().getEmail()||""});
      const json=JSON.stringify(markers);if(json.length>45000)throw new Error("The game's adjustment history is full.");record.sheet.getRange(record.rowNumber,record.cols["Plan Adjustments"]+1).setValue(json);record.sheet.getRange(record.rowNumber,record.cols["Updated At"]+1).setValue(new Date());
    }
  }finally{lock.releaseLock();}return getLiveGameTracker(gameId);
}
function buildLiveReviewInsights_(log,markers){
  log=log||[];const analytics=buildLiveAnalyticsSummary_(log,1),intel=analytics.intelligence||{},keep=[],address=[],players=[];
  if((intel.kills||{}).total)keep.push(intel.kills.total+" defensive kills from "+intel.kills.totalStops+" recorded stops; longest stop run "+intel.kills.longestStops+". Reinforce the communication and execution seen in those possessions.");
  ["offense","defense"].forEach(function(side){const paint=(intel.paint||{})[side]||{},yes=paint.withTouch||{},no=paint.withoutTouch||{};
    if(yes.possessions>=3&&no.possessions>=3&&yes.points/yes.possessions>no.points/no.possessions){const text=(side==="offense"?"Your team":"Opponent")+" scored "+(yes.points/yes.possessions).toFixed(2)+" PPP with paint touches (n="+yes.possessions+") versus "+(no.points/no.possessions).toFixed(2)+" without (n="+no.possessions+"). "+(side==="offense"?"Keep creating suitable paint-entry opportunities.":"Address paint containment and help positioning.")+" Tracked association; review matchup context.";(side==="offense"?keep:address).push(text);}
  });
  const off=analytics.offense||{};if(off.possessions>=3&&off.turnovers>=3&&off.turnovers/off.possessions>=0.2)address.push(off.turnovers+" turnovers on "+off.possessions+" recorded offensive possessions ("+(100*off.turnovers/off.possessions).toFixed(1)+"%). Review the decisions and pressure that preceded them.");
  (intel.tagPatterns||[]).filter(function(t){return t.type!=="paintTouch"&&t.type!=="deflection"&&t.possessions>=3&&t.scored/t.possessions>=2/3;}).sort(function(a,b){return b.possessions-a.possessions;}).slice(0,4).forEach(function(t){(t.side==="offense"?keep:address).push((t.side==="offense"?"Your team":"Opponent")+" · "+t.label+": scored on "+t.scored+"/"+t.possessions+" tagged possessions for "+t.points+" points. "+(t.side==="offense"?"Keep looking for these opportunities against suitable coverage.":"Review the coverage for this action.")+" Tags can overlap; this does not isolate cause.");});
  (analytics.playerTotals||[]).forEach(function(p){const who=(p.playerSide==="opponent"?"Opponent":"Our")+" #"+p.jersey,items=[];if(p.offensiveRebounds>=3)items.push(p.offensiveRebounds+" offensive rebounds");if(p.deflections>=3)items.push(p.deflections+" deflections");if(p.paintTouches>=5)items.push(p.paintTouches+" paint touches");if(p.points>=6)items.push(p.points+" points");if(items.length)players.push({side:p.playerSide,jersey:p.jersey,text:who+" credited with "+items.join(", ")+". Credited events only; unassigned plays are excluded.",priority:p.offensiveRebounds*3+p.points});});
  players.sort(function(a,b){return b.priority-a.priority;});players.slice(0,4).forEach(function(p){if(p.side==="opponent"&&p.text.indexOf("offensive rebounds")>=0)address.push(p.text+" Review box-out assignments.");});
  const tactical=(markers||[]).filter(function(m){return m.kind==="tactical"&&Number.isFinite(Number(m.boundarySequence));});
  const comparisons=tactical.map(function(m,index){const next=tactical[index+1],end=next?Number(next.boundarySequence):Infinity,rows=[];["offense","defense"].forEach(function(side){if(m.side!=="both"&&m.side!==side)return;const before=log.filter(function(p){return p.teamSide===side&&Number(p.sequence)<=Number(m.boundarySequence);}).slice(-10),after=log.filter(function(p){return p.teamSide===side&&Number(p.sequence)>Number(m.boundarySequence)&&Number(p.sequence)<=end;});
      const total=function(items){return items.reduce(function(n,p){return n+Number(p.points||0);},0);},a=total(before),b=total(after);rows.push({side:side,before:{possessions:before.length,points:a,ppp:before.length?a/before.length:null},after:{possessions:after.length,points:b,ppp:after.length?b/after.length:null},text:(side==="defense"?"Points allowed":"Points scored")+": before "+(before.length?(a/before.length).toFixed(2):"—")+" PPP ("+a+" pts / "+before.length+" poss), "+(next?"until next marker":"since marker")+" "+(after.length?(b/after.length).toFixed(2):"—")+" PPP ("+b+" pts / "+after.length+" poss)."+(before.length<10||after.length<10?" Small sample.":"")});});
    return{label:m.label,period:m.period,changedAt:m.changedAt,rows:rows,note:"Last 10 recorded possessions per side before the marker versus recorded possessions after it, ending at the next marker. Recorded order includes late-arriving taps. Opponents, lineups and other changes can affect results; this does not prove the adjustment caused the change."};});
  return{keepDoing:keep.slice(0,4),address:address.slice(0,4),playerAlerts:players.slice(0,4),adjustments:comparisons,coverage:"Highlights use completed recorded possessions. Small samples, missing possessions, untracked tags and incomplete player attribution limit conclusions. Use these as film-review priorities going forward."};
}
function addLiveReviewToReport_(report,tracker){const review=buildLiveReviewInsights_((tracker.analytics||{}).possessionLog||[],tracker.planAdjustments||[]);(report.objectives||[]).forEach(function(o){if(o.status==="winning")review.keepDoing.push(o.summary||o.label);if(o.status==="behind")review.address.push((o.summary||o.label)+(o.recommendation?" "+o.recommendation:""));});review.keepDoing=review.keepDoing.slice(0,4);review.address=review.address.slice(0,4);if(report.finalScore){const our=Number((tracker.analytics.offense||{}).points||0)+Number(tracker.ourScore||0),opponent=Number((tracker.analytics.defense||{}).points||0)+Number(tracker.opponentScore||0);if(our!==report.finalScore.our||opponent!==report.finalScore.opponent)review.scoreNote="Recorded-possession score plus score-only adjustments: "+our+"–"+opponent+". Confirmed final score: "+report.finalScore.our+"–"+report.finalScore.opponent+". Corrections update tracked statistics, not the confirmed final score.";}report.gameReview=review;return report;}
function getLiveGameReview(gameId){
  requireStaffCapability_("run_sessions");const record=requireLiveReviewGame_(gameId),tracker=getLiveGameTracker(gameId);let report;
  if(String(record.game.Status)==="Completed"){let stored=parseLiveGameObject_(record.game["Final Report"],null);if(stored&&stored.snapshotId)stored=readGameReportSnapshot_(gameId,"postgame",stored.snapshotId);if(!stored)throw new Error("The saved postgame report is unavailable.");report=refreshCompletedGameReview_(stored,record,tracker);}else report=addLiveReviewToReport_(buildLiveGameCheckpointReport_(tracker,"Review"),tracker);
  return{tracker:tracker,report:report};
}
function refreshCompletedGameReview_(report,record,currentTracker){
  const tracker=currentTracker||getLiveGameTracker(String(record.game["Game ID"])),old=report,previous=getPreviousCompletedReports_(tracker.game.team).filter(function(r){return String((r.game||{}).gameId||r.gameId||"")!==String(tracker.game.gameId);});
  report=tracker.objectives&&tracker.objectives.length?buildLiveGamePostgameReport_(tracker,previous):buildOptionalTrackerPostgameReport_(tracker);
  report.analytics=tracker.analytics;report.possessionFocus=tracker.possessionFocus;report.possessions=tracker.possessions;report.period=tracker.game.currentPeriod;report.analyticsBenchmarks=tracker.analyticsBenchmarks;
  report.game=Object.assign({},tracker.game);report.finalScore=old.finalScore||{our:Number(record.game["Our Score"]||0),opponent:Number(record.game["Opponent Score"]||0)};report.gameResult=old.gameResult||String(record.game["Game Result"]||"");report.completedAt=old.completedAt||formatLiveGameTimestamp_(record.game["Completed At"]);report.scoutingWatchlist=buildLiveNextAdjustment_(report.analytics,tracker.scoutingWatchlist||[],report.recommendations||[],report.objectives||[]).watchlist;
  return addLiveReviewToReport_(report,tracker);
}
