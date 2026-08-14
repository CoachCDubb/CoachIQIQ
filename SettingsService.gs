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
  setSettingValues_({
    "Program Name": String(data.programName || "").trim(),
    "School Name": String(data.schoolName || "").trim(),
    "Current Season": String(data.currentSeason || "").trim(),
    "Sport": String(data.sport || "Football").trim(),
    "Primary Color": normalizeThemeColor_(data.primaryColor, "#1E3A5F"),
    "Secondary Color": normalizeThemeColor_(data.secondaryColor, "#F59E0B"),
    "Logo URL": /^https:\/\//i.test(String(data.logoUrl || "").trim())
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
/**
 * Saves the Teams setting.
 */
function saveTeams(teams) {

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

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(SETTINGS_SHEET);

  const data = sheet.getDataRange().getValues();

  for (let i = 0; i < data.length; i++) {

    if (data[i][0] === settingName) {

      sheet
        .getRange(i + 1, 2)
        .setValue(items.join(", "));

      return;

    }

  }

}
