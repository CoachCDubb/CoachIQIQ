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

return {
teams: getSettingList("Teams"),
positions: getSettingList("Positions"),
statuses: getSettingList("Player Statuses"),
cultureCategories: getSettingList("Culture Categories"),
staff: getSettingList("Staff"),
rewards: getActiveRewards()
};

}

/**
 * Returns all CoachIQ settings.
 */
function getCoachIQSettings() {

return {

    programName: getSetting("Program Name"),

    schoolName: getSetting("School Name"),

    currentSeason: getSetting("Current Season"),

    teams: getSettingList("Teams"),

    positions: getSettingList("Positions"),

    statuses: getSettingList("Player Statuses"),

    cultureCategories: getSettingList("Culture Categories"),

   staff: getSettingList("Staff"),

rewards: getActiveRewards(),

playerRequiredFields: getSettingList("Player Required Fields"),

playerIdPrefix: getSetting("Player ID Prefix"),

version: getSetting("CoachIQ Version")

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