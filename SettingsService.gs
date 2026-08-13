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

    teams: splitSettingList_(settings["Teams"]),

    positions: splitSettingList_(settings["Positions"]),

    statuses: splitSettingList_(settings["Player Statuses"]),

    cultureCategories: splitSettingList_(settings["Culture Categories"]),

   staff: splitSettingList_(settings["Staff"]),

rewards: getActiveRewards(),

playerRequiredFields: splitSettingList_(settings["Player Required Fields"]),

playerIdPrefix: settings["Player ID Prefix"] || "",

version: settings["CoachIQ Version"] || ""

};

}
/**
 * Saves Program Information settings.
 */
function saveProgramInformation(data) {

  const sheet = SpreadsheetApp
    .getActive()
    .getSheetByName(SETTINGS_SHEET);

  const settings = sheet.getDataRange().getValues();

  for (let i = 0; i < settings.length; i++) {

    switch (settings[i][0]) {

      case "Program Name":
        sheet.getRange(i + 1, 2).setValue(data.programName);
        break;

      case "School Name":
        sheet.getRange(i + 1, 2).setValue(data.schoolName);
        break;

      case "Current Season":
        sheet.getRange(i + 1, 2).setValue(data.currentSeason);
        break;

    }

  }

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
