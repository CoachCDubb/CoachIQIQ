/** Configurable session types and attendance consequences. */
const SESSION_POLICIES_SETTING = "Session Policies";
const SESSION_POLICY_MAX = 30;

function getDefaultSessionPolicies_() {
  return [
    {id:"practice", name:"Practice", active:true, trackAttendance:true, enableEvaluations:true, allowRewards:true, allowNotes:true, excusedTreatment:"exclude", unexcusedPoints:-1},
    {id:"breakfast-club", name:"Breakfast Club", active:true, trackAttendance:true, enableEvaluations:false, allowRewards:false, allowNotes:true, excusedTreatment:"exclude", unexcusedPoints:-1}
  ];
}

function getSessionPolicies_() {
  let policies = [];
  try { policies = JSON.parse(getSetting(SESSION_POLICIES_SETTING) || "[]"); } catch (error) { policies = []; }
  if (!Array.isArray(policies) || !policies.length) policies = getDefaultSessionPolicies_();
  return normalizeSessionPolicies_(policies);
}

function getSessionPolicies() {
  requireStaffCapability_("manage_settings");
  return getSessionPolicies_();
}

function saveSessionPolicies(policies) {
  requireStaffCapability_("manage_settings");
  const previous = getSessionPolicies_();
  const cleaned = normalizeSessionPolicies_(policies);
  if (!cleaned.length) throw new Error("Keep at least one session type.");
  if (!cleaned.some(function(policy){ return policy.active; })) throw new Error("Keep at least one active session type.");
  setSettingValues_((function(){ const update={}; update[SESSION_POLICIES_SETTING]=JSON.stringify(cleaned); return update; })());
  try { logCoachIQAudit({action:"UPDATE_SESSION_POLICIES",entityType:"Program Settings",entityId:SESSION_POLICIES_SETTING,team:"",beforeValue:previous,afterValue:cleaned,success:true,error:""}); } catch (error) { console.error("Session policies saved, but audit logging failed: " + error.message); }
  return cleaned;
}

function normalizeSessionPolicies_(policies) {
  if (!Array.isArray(policies) || policies.length > SESSION_POLICY_MAX) throw new Error("A maximum of 30 session types is allowed.");
  const ids = {}, names = {};
  return policies.map(function(policy, index) {
    policy = policy || {};
    const name = String(policy.name || "").trim().slice(0, 60);
    if (!name) throw new Error("Every session type needs a name.");
    const nameKey = name.toLowerCase();
    if (names[nameKey]) throw new Error("Session type names must be unique.");
    names[nameKey] = true;
    let id = String(policy.id || nameKey.replace(/[^a-z0-9]+/g,"-")).replace(/[^a-z0-9-]/gi,"").slice(0,50) || "session-"+(index+1);
    if (ids[id]) id += "-"+(index+1);
    ids[id] = true;
    const points = Math.min(0, Math.max(-100, Math.round(Number(policy.unexcusedPoints || 0))));
    return {id:id,name:name,active:policy.active!==false,trackAttendance:policy.trackAttendance!==false,
      enableEvaluations:policy.enableEvaluations!==false,allowRewards:policy.allowRewards!==false,
      allowNotes:policy.allowNotes!==false,excusedTreatment:["exclude","present","absent"].indexOf(policy.excusedTreatment)>=0?policy.excusedTreatment:"exclude",
      unexcusedPoints:points};
  });
}

function getSessionPolicyByName_(name, includeInactive) {
  const target = String(name || "").trim().toLowerCase();
  const policy = getSessionPolicies_().find(function(item){ return (includeInactive || item.active) && item.name.toLowerCase() === target; });
  if (!policy) throw new Error("Choose an active session type configured in Settings.");
  return policy;
}
