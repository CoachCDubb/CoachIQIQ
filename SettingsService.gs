/**
 * ======================================
 * Settings Service
 * ======================================
 */

const SETTINGS_SHEET = "Settings";

/**
 * Returns a setting by name.
 */
function getSetting(settingName) {

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(SETTINGS_SHEET);

  const data = sheet.getDataRange().getValues();

  for (let i = 0; i < data.length; i++) {

    if (data[i][0] === settingName) {

      return data[i][1];

    }

  }

  return "";

}
/**
 * Returns a comma-separated setting as an array.
 */
function getSettingList(settingName) {

  const value = getSetting(settingName);

  if (!value) {
    return [];
  }

  return value.split(",").map(item => item.trim());

}
/**
 * Returns all dropdown settings for CoachIQ.
 */
function getDropdownSettings() {

const settings = getSettingsMap_();

return {
teams: splitSettingList_(settings["Teams"]),
positions: splitSettingList_(settings["Positions"]),
statuses: splitSettingList_(settings["Player Statuses"]),
cultureCategories: splitSettingList_(settings["Culture Categories"]),
staff: splitSettingList_(settings["Staff"]),
sessionPolicies: typeof getSessionPolicies_ === "function" ? getSessionPolicies_().filter(function(policy){ return policy.active; }) : [],
rewards: getActiveRewards()
};

}

function getSettingsMap_() {

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(SETTINGS_SHEET);
  const data = sheet.getDataRange().getValues();
  const settings = {};

  data.forEach(function(row){
    const name = row[0];

    if(name !== "" && !Object.prototype.hasOwnProperty.call(settings, name)){
      settings[name] = row[1];
    }
  });

  return settings;

}

function splitSettingList_(value) {

  if (!value) {
    return [];
  }

  return String(value).split(",").map(function(item){
    return item.trim();
  });

}

/**
 * Returns all CoachIQ settings.
 */
function getCoachIQSettings() {

const settings = getSettingsMap_();

return {

    programName: settings["Program Name"] || "",

    schoolName: settings["School Name"] || "",

    mascotName: settings["Mascot Name"] || "",

    currentSeason: settings["Current Season"] || "",

    sport: settings["Sport"] || "Football",

    primaryColor: normalizeThemeColor_(settings["Primary Color"], "#1E3A5F"),

    secondaryColor: normalizeThemeColor_(settings["Secondary Color"], "#F59E0B"),

    logoUrl: settings["Logo URL"] || "",

    teams: splitSettingList_(settings["Teams"]),

    positions: splitSettingList_(settings["Positions"]),

    statuses: splitSettingList_(settings["Player Statuses"]),

    cultureCategories: splitSettingList_(settings["Culture Categories"]),

   staff: splitSettingList_(settings["Staff"]),

sessionPolicies: typeof getSessionPolicies_ === "function" ? getSessionPolicies_() : [],

rewards: getPointAwards(),

playerRequiredFields: splitSettingList_(settings["Player Required Fields"]),

playerIdPrefix: settings["Player ID Prefix"] || "",

version: settings["CoachIQ Version"] || ""

};

}
/**
 * Saves Program Information settings.
 */
function saveProgramInformation(data) {
  requireStaffCapability_("manage_settings");
  const beforeSettings = getCoachIQSettings();
  const updates = {
    "Program Name": String(data.programName || "").trim(),
    "School Name": String(data.schoolName || "").trim(),
    "Mascot Name": String(data.mascotName || "").trim(),
    "Current Season": String(data.currentSeason || "").trim(),
    "Sport": String(data.sport || "Football").trim(),
    "Primary Color": normalizeThemeColor_(data.primaryColor, "#1E3A5F"),
    "Secondary Color": normalizeThemeColor_(data.secondaryColor, "#F59E0B"),
    "Logo URL": String(data.logoUrl || "").trim().toLowerCase().indexOf("https://") === 0
      ? String(data.logoUrl).trim() : ""
  };
  setSettingValues_(updates);

  const afterSettings = getCoachIQSettings();
  try {
    logCoachIQAudit({
      action: "UPDATE_PROGRAM_INFORMATION",
      entityType: "Program Settings",
      entityId: "PROGRAM_IDENTITY",
      team: "",
      beforeValue: {
        programName: beforeSettings.programName,
        schoolName: beforeSettings.schoolName,
        mascotName: beforeSettings.mascotName,
        currentSeason: beforeSettings.currentSeason,
        sport: beforeSettings.sport,
        primaryColor: beforeSettings.primaryColor,
        secondaryColor: beforeSettings.secondaryColor,
        logoUrl: beforeSettings.logoUrl
      },
      afterValue: {
        programName: afterSettings.programName,
        schoolName: afterSettings.schoolName,
        mascotName: afterSettings.mascotName,
        currentSeason: afterSettings.currentSeason,
        sport: afterSettings.sport,
        primaryColor: afterSettings.primaryColor,
        secondaryColor: afterSettings.secondaryColor,
        logoUrl: afterSettings.logoUrl
      },
      success: true,
      error: ""
    });
  } catch (auditError) {
    console.error("Program information saved, but audit logging failed: " + auditError.message);
  }

  return afterSettings;

}

function setSettingValues_(updates) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SETTINGS_SHEET);
  if (!sheet) {
    throw new Error("The Settings sheet was not found.");
  }

  const values = sheet.getDataRange().getValues();
  const rows = {};
  values.forEach(function(row, index) {
    const name = String(row[0] || "").trim();
    if (name && !rows[name]) {
      rows[name] = index + 1;
    }
  });

  Object.keys(updates).forEach(function(name) {
    const value = safeSettingValue_(updates[name]);
    if (rows[name]) {
      sheet.getRange(rows[name], 2).setValue(value);
    } else {
      sheet.appendRow([name, value]);
    }
  });
}

function safeSettingValue_(value) {
  const text = String(value == null ? "" : value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function uploadCoachIQLogo(file) {
  requireStaffCapability_("manage_settings");
  file = file || {};
  const mimeType = String(file.mimeType || "");
  if (["image/png", "image/jpeg"].indexOf(mimeType) === -1) {
    throw new Error("Choose a PNG or JPEG logo.");
  }
  const bytes = Utilities.base64Decode(String(file.base64 || ""));
  if (!bytes.length || bytes.length > 2 * 1024 * 1024) {
    throw new Error("The logo must be smaller than 2 MB.");
  }
  const safeName = String(file.name || "coachiq-logo").replace(/[^a-z0-9._-]/gi, "-");
  const previousLogoUrl = getSetting("Logo URL");
  const previousFileId = getSetting("Logo File ID");
  const driveFile = DriveApp.createFile(Utilities.newBlob(bytes, mimeType, safeName));
  try { driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (error) { /* Domain policy may require signed-in access. */ }
  const url = "https://drive.google.com/thumbnail?id=" + driveFile.getId() + "&sz=w400";
  setSettingValues_({"Logo URL": url, "Logo File ID": driveFile.getId()});
  if (previousFileId && previousFileId !== driveFile.getId()) {
    try { DriveApp.getFileById(previousFileId).setTrashed(true); } catch (error) { /* Keep inaccessible legacy files untouched. */ }
  }

  try {
    logCoachIQAudit({
      action: "UPLOAD_PROGRAM_LOGO",
      entityType: "Program Logo",
      entityId: driveFile.getId(),
      team: "",
      beforeValue: {
        fileId: previousFileId,
        url: previousLogoUrl
      },
      afterValue: {
        fileId: driveFile.getId(),
        url: url,
        name: driveFile.getName(),
        mimeType: mimeType,
        sizeBytes: bytes.length
      },
      success: true,
      error: ""
    });
  } catch (auditError) {
    console.error("Program logo uploaded, but audit logging failed: " + auditError.message);
  }

  return {url: url, name: driveFile.getName()};
}

function getStaffDirectoryData() {
  requireStaffCapability_("manage_settings");
  const settings = getCoachIQSettings();
  let profiles = [];
  try { profiles = JSON.parse(getSetting("Staff Profiles") || "[]"); } catch (error) { profiles = []; }
  if (!Array.isArray(profiles) || !profiles.length) {
    profiles = settings.staff.map(function(name, index) {
      return {id: "staff-" + (index + 1), name: name, email: "", role: index ? "Assistant Coach" : "Head Coach", teams: [], positions: [], capabilities: index ? ["run_sessions", "evaluate_players", "view_intelligence"] : ["manage_roster", "run_sessions", "evaluate_players", "view_intelligence", "manage_settings"]};
    });
  }
  return {profiles: profiles, teams: settings.teams || [], positions: settings.positions || []};
}

function saveStaffProfiles(profiles) {
  requireStaffCapability_("manage_settings");
  if (!Array.isArray(profiles) || profiles.length > 100) throw new Error("Invalid staff directory.");
  let previousProfiles = [];
  try {
    previousProfiles = JSON.parse(getSetting("Staff Profiles") || "[]");
  } catch (error) {
    previousProfiles = [];
  }
  if (!Array.isArray(previousProfiles)) previousProfiles = [];
  const allowedRoles = ["Head Coach", "Assistant Coach", "Position Coach", "Analyst", "Support Staff"];
  const allowedCapabilities = ["manage_roster", "run_sessions", "evaluate_players", "view_intelligence", "manage_settings"];
  const validTeams = getCoachIQSettings().teams || [];
  const validPositions = getCoachIQSettings().positions || [];
  const cleaned = profiles.map(function(profile, index) {
    const name = String(profile.name || "").trim();
    if (!name) throw new Error("Every staff member needs a name.");
    const role = allowedRoles.indexOf(profile.role) >= 0 ? profile.role : "Assistant Coach";
    const positions = (profile.positions || []).filter(function(position) { return validPositions.indexOf(position) >= 0; });
    if (role === "Position Coach" && !positions.length) throw new Error(name + " is a Position Coach and needs at least one position group.");
    return {id: String(profile.id || "staff-" + (index + 1)), name: name, email: String(profile.email || "").trim().toLowerCase(), role: role,
      teams: (profile.teams || []).filter(function(team) { return validTeams.indexOf(team) >= 0; }), positions: positions,
      capabilities: (profile.capabilities || []).filter(function(capability) { return allowedCapabilities.indexOf(capability) >= 0; })};
  });
  const activeEmail = String(Session.getActiveUser().getEmail() || "").trim().toLowerCase();
  const verifiedProfiles = cleaned.filter(function(profile) { return profile.email; });
  if (verifiedProfiles.length) {
    if (!activeEmail) throw new Error("Google did not provide your account email, so access control cannot be enabled safely.");
    const owner = cleaned.some(function(profile) { return profile.role === "Head Coach" && profile.email === activeEmail; });
    if (!owner) throw new Error("Before saving staff access, assign your Google account email to a Head Coach profile.");
  }
  setSettingValues_({"Staff": cleaned.map(function(p) { return p.name; }).join(", "), "Staff Profiles": JSON.stringify(cleaned)});

  try {
    logCoachIQAudit({
      action: "UPDATE_STAFF_DIRECTORY",
      entityType: "Staff Directory",
      entityId: "STAFF_PROFILES",
      team: "",
      beforeValue: previousProfiles,
      afterValue: cleaned,
      success: true,
      error: ""
    });
  } catch (auditError) {
    console.error("Staff directory saved, but audit logging failed: " + auditError.message);
  }

  return {profiles: cleaned, teams: validTeams, positions: validPositions};
}
/**
 * Saves the Teams setting.
 */
function saveTeams(teams) {
  requireStaffCapability_("manage_settings");

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(SETTINGS_SHEET);

  const data = sheet.getDataRange().getValues();

  for (let i = 0; i < data.length; i++) {

    if (data[i][0] === "Teams") {

      sheet
        .getRange(i + 1, 2)
        .setValue(teams.join(", "));

      return;

    }

  }

}
/**
 * Saves any comma-separated setting list.
 */
function saveSettingList(settingName, items) {
  requireStaffCapability_("manage_settings");
  const allowedSettings = ["Staff", "Teams", "Positions", "Player Statuses", "Culture Categories"];
  if (allowedSettings.indexOf(settingName) === -1) {
    throw new Error("This CoachIQ setting cannot be changed from the list editor.");
  }
  const previousItems = getSettingList(settingName);
  const cleanedItems = (Array.isArray(items) ? items : []).map(function(item) {
    return String(item || "").trim();
  }).filter(function(item) {
    return item !== "";
  });
  setSettingValues_((function() {
    const update = {};
    update[settingName] = cleanedItems.join(", ");
    return update;
  })());
  const settings = getCoachIQSettings();

  try {
    logCoachIQAudit({
      action: "UPDATE_SETTING_LIST",
      entityType: "Program Settings",
      entityId: settingName,
      team: settingName === "Teams" ? cleanedItems.join(", ") : "",
      beforeValue: previousItems,
      afterValue: cleanedItems,
      success: true,
      error: ""
    });
  } catch (auditError) {
    console.error(settingName + " saved, but audit logging failed: " + auditError.message);
  }

  return settings;
}

function getCurrentStaffAccess_() {
  let profiles = [];
  try { profiles = JSON.parse(getSetting("Staff Profiles") || "[]"); } catch (error) { profiles = []; }
  const verified = Array.isArray(profiles) ? profiles.filter(function(profile) { return String(profile.email || "").trim(); }) : [];
  const allCapabilities = ["manage_roster", "run_sessions", "evaluate_players", "view_intelligence", "manage_settings"];
  if (!verified.length) return {configured: false, email: "", role: "Owner setup", teams: [], positions: [], capabilities: allCapabilities};
  const email = String(Session.getActiveUser().getEmail() || "").trim().toLowerCase();
  const profile = verified.find(function(item) { return String(item.email || "").trim().toLowerCase() === email; });
  if (!profile) return {configured: true, email: email, role: "Unassigned", teams: [], positions: [], capabilities: []};
  const capabilities = profile.role === "Head Coach" ? allCapabilities : (profile.capabilities || []);
  return {configured: true, email: email, name: profile.name, role: profile.role, teams: profile.teams || [], positions: profile.positions || [], capabilities: capabilities};
}

/** Returns the signed-in staff identity needed by browser UI controls. */
function getCurrentStaffAccessForUI() {
  const access = getCurrentStaffAccess_();
  return {
    configured: access.configured === true,
    email: access.email || "",
    name: access.name || "",
    role: access.role || "",
    teams: access.teams || [],
    positions: access.positions || [],
    capabilities: access.capabilities || []
  };
}

function filterPlayersForCurrentStaff_(players) {
  const access = getCurrentStaffAccess_();
  if (!access.configured || access.role === "Head Coach" || access.capabilities.indexOf("manage_settings") >= 0) return players;
  return players.filter(function(player) {
    const team = Array.isArray(player) ? player[5] : player.Team || player.team;
    const position = Array.isArray(player) ? player[6] : player.Position || player.position;
    return (!access.teams.length || access.teams.indexOf(String(team || "")) >= 0) && (!access.positions.length || access.positions.indexOf(String(position || "")) >= 0);
  });
}

function requirePlayerAccess_(playerId) {
  if (!filterPlayersForCurrentStaff_(getPlayers()).some(function(player) { return String(player[0]) === String(playerId); })) throw new Error("You do not have access to this player's team or position group.");
}

function requireStaffCapability_(capability) {
  const access = getCurrentStaffAccess_();
  if (access.capabilities.indexOf(capability) === -1) throw new Error("You do not have permission to access this CoachIQ section.");
  return access;
}
