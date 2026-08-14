/**
 * Returns the safe first-run state used before the main UI loads.
 */
function getCoachIQBootstrap() {
  const settings = getSettingsMap_();
  const hasSetupMarker = Object.prototype.hasOwnProperty.call(settings, "Setup Complete");
  const configured = hasSetupMarker
    ? String(settings["Setup Complete"] || "").toLowerCase() === "true"
    : Boolean(settings["Program Name"] && settings["School Name"] &&
      settings["Current Season"] && settings["Teams"]);

  return {
    setupRequired: !configured,
    settings: getCoachIQSettings()
  };
}

/**
 * Saves first-run settings without touching operational data sheets.
 */
function completeCoachIQOnboarding(data) {
  data = data || {};
  const required = {
    programName: "Program Name",
    schoolName: "School Name",
    currentSeason: "Current Season"
  };

  Object.keys(required).forEach(function(key) {
    if (!String(data[key] || "").trim()) {
      throw new Error(required[key] + " is required.");
    }
  });

  const lists = {
    teams: normalizeOnboardingList_(data.teams),
    positions: normalizeOnboardingList_(data.positions),
    statuses: normalizeOnboardingList_(data.statuses),
    cultureCategories: normalizeOnboardingList_(data.cultureCategories),
    staff: normalizeOnboardingList_(data.staff)
  };

  if (!lists.teams.length) {
    throw new Error("At least one team is required.");
  }
  if (!lists.cultureCategories.length) {
    throw new Error("At least one evaluation category is required.");
  }
  if (!lists.staff.length) {
    throw new Error("At least one coach or staff member is required.");
  }

  const primaryColor = normalizeThemeColor_(data.primaryColor, "#1E3A5F");
  const secondaryColor = normalizeThemeColor_(data.secondaryColor, "#F59E0B");
  const logoUrl = String(data.logoUrl || "").trim();
  if (logoUrl && logoUrl.toLowerCase().indexOf("https://") !== 0) {
    throw new Error("Logo URL must begin with https://");
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    setSettingValues_({
      "Program Name": String(data.programName).trim(),
      "School Name": String(data.schoolName).trim(),
      "Mascot Name": normalizeMascotName_(data.mascotName),
      "Current Season": String(data.currentSeason).trim(),
      "Sport": String(data.sport || "Football").trim(),
      "Primary Color": primaryColor,
      "Secondary Color": secondaryColor,
      "Logo URL": logoUrl,
      "Teams": lists.teams.join(", "),
      "Positions": lists.positions.join(", "),
      "Player Statuses": lists.statuses.join(", "),
      "Culture Categories": lists.cultureCategories.join(", "),
      "Staff": lists.staff.join(", ")
    });

    if (Array.isArray(data.rewards) && data.rewards.length) {
      savePointRewards_(data.rewards.map(function(reward) {
        return {
          id: "",
          name: String(reward.name || "").trim(),
          points: Number(reward.points),
          active: true
        };
      }).filter(function(reward) {
        return reward.name && isFinite(reward.points);
      }));
    }

    // Mark setup complete only after every required save succeeds.
    setSettingValues_({"Setup Complete": "TRUE"});
  } finally {
    lock.releaseLock();
  }

  return getCoachIQBootstrap();
}

function normalizeMascotName_(value) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 50);
}

function normalizeOnboardingList_(value) {
  const items = Array.isArray(value) ? value : String(value || "").split(",");
  const seen = {};
  return items.map(function(item) {
    return String(item || "").trim();
  }).filter(function(item) {
    const key = item.toLowerCase();
    if (!item || seen[key]) {
      return false;
    }
    seen[key] = true;
    return true;
  });
}

function normalizeThemeColor_(value, fallback) {
  const color = String(value || "").trim().toUpperCase();
  return /^#[0-9A-F]{6}$/.test(color) ? color : fallback;
}
