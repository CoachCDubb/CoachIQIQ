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
  setSettingValues_({
    "Program Name": String(data.programName || "").trim(),
    "School Name": String(data.schoolName || "").trim(),
    "Mascot Name": String(data.mascotName || "").trim(),
    "Current Season": String(data.currentSeason || "").trim(),
    "Sport": String(data.sport || "Football").trim(),
    "Primary Color": normalizeThemeColor_(data.primaryColor, "#1E3A5F"),
    "Secondary Color": normalizeThemeColor_(data.secondaryColor, "#F59E0B"),
    "Logo URL": String(data.logoUrl || "").trim().toLowerCase().indexOf("https://") === 0
      ? String(data.logoUrl).trim() : ""
  });

  return getCoachIQSettings();

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
  const previousFileId = getSetting("Logo File ID");
  const driveFile = DriveApp.createFile(Utilities.newBlob(bytes, mimeType, safeName));
  try { driveFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (error) { /* Domain policy may require signed-in access. */ }
  const url = "https://drive.google.com/thumbnail?id=" + driveFile.getId() + "&sz=w400";
  setSettingValues_({"Logo URL": url, "Logo File ID": driveFile.getId()});
  if (previousFileId && previousFileId !== driveFile.getId()) {
    try { DriveApp.getFileById(previousFileId).setTrashed(true); } catch (error) { /* Keep inaccessible legacy files untouched. */ }
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
      return {id: "staff-" + (index + 1), name: name, email: "", role: index ? "Assistant Coach" : "Head Coach", teams: [], capabilities: index ? ["run_sessions", "evaluate_players", "view_intelligence"] : ["manage_roster", "run_sessions", "evaluate_players", "view_intelligence", "manage_settings"]};
    });
  }
  return {profiles: profiles, teams: settings.teams || []};
}

function saveStaffProfiles(profiles) {
  requireStaffCapability_("manage_settings");
  if (!Array.isArray(profiles) || profiles.length > 100) throw new Error("Invalid staff directory.");
  const allowedRoles = ["Head Coach", "Assistant Coach", "Position Coach", "Analyst", "Support Staff"];
  const allowedCapabilities = ["manage_roster", "run_sessions", "evaluate_players", "view_intelligence", "manage_settings"];
  const validTeams = getCoachIQSettings().teams || [];
  const cleaned = profiles.map(function(profile, index) {
    const name = String(profile.name || "").trim();
    if (!name) throw new Error("Every staff member needs a name.");
    const role = allowedRoles.indexOf(profile.role) >= 0 ? profile.role : "Assistant Coach";
    return {id: String(profile.id || "staff-" + (index + 1)), name: name, email: String(profile.email || "").trim().toLowerCase(), role: role,
      teams: (profile.teams || []).filter(function(team) { return validTeams.indexOf(team) >= 0; }),
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
  return {profiles: cleaned, teams: validTeams};
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
  return getCoachIQSettings();
}

function getCurrentStaffAccess_() {
  let profiles = [];
  try { profiles = JSON.parse(getSetting("Staff Profiles") || "[]"); } catch (error) { profiles = []; }
  const verified = Array.isArray(profiles) ? profiles.filter(function(profile) { return String(profile.email || "").trim(); }) : [];
  const allCapabilities = ["manage_roster", "run_sessions", "evaluate_players", "view_intelligence", "manage_settings"];
  if (!verified.length) return {configured: false, email: "", role: "Owner setup", teams: [], capabilities: allCapabilities};
  const email = String(Session.getActiveUser().getEmail() || "").trim().toLowerCase();
  const profile = verified.find(function(item) { return String(item.email || "").trim().toLowerCase() === email; });
  if (!profile) return {configured: true, email: email, role: "Unassigned", teams: [], capabilities: []};
  const capabilities = profile.role === "Head Coach" ? allCapabilities : (profile.capabilities || []);
  return {configured: true, email: email, name: profile.name, role: profile.role, teams: profile.teams || [], capabilities: capabilities};
}

function requireStaffCapability_(capability) {
  const access = getCurrentStaffAccess_();
  if (access.capabilities.indexOf(capability) === -1) throw new Error("You do not have permission to access this CoachIQ section.");
  return access;
}
