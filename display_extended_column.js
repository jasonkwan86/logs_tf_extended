const isFirefox = typeof browser !== "undefined";
const currentBrowser = isFirefox ? browser : chrome;

const timer = (ms) => new Promise((res) => setTimeout(res, ms));

const getRGLProfile = async (steamID) => await sendMessageAndWait("rgl_profile", steamID);
const getETF2LProfile = async (steamID) => await sendMessageAndWait("etf2l_profile", steamID);
const getRGLPastTeams = async (steamID) => await sendMessageAndWait("rgl_past_teams", steamID);

const sendMessageAndWait = async (type, steamID) => await currentBrowser.runtime.sendMessage({ type, steamID });

const getShowETF2LFlag = async () => (await currentBrowser.storage.local.get("showETF2L")).showETF2L;
const getShowRGLFlag = async () => (await currentBrowser.storage.local.get("showRGL")).showRGL;
const getHighestDivisionPlayedFlag = async () =>
  (await currentBrowser.storage.local.get("getHighestDivisionPlayed")).getHighestDivisionPlayed;

const RGLDivisions = Object.freeze({
  None: 0,
  Newcomer: 1,
  Amateur: 2,
  Intermediate: 3,
  Main: 4,
  Advanced: 5,
  Invite: 6,
});

const RGLDivisionsInverse = Object.freeze({
  0: "None",
  1: "Newcomer",
  2: "Amateur",
  3: "Intermediate",
  4: "Main",
  5: "Advanced",
  6: "Invite",
});

const RGLDivisionSpecs = Object.freeze({
  None: {
    backgroundColor: "gray",
    textColor: "black",
    shortenedName: "NEW",
  },
  Newcomer: {
    backgroundColor: "#c54c36",
    textColor: "white",
    shortenedName: "NC",
  },
  Amateur: {
    backgroundColor: "#d0cd36",
    textColor: "black",
    shortenedName: "AM",
  },
  Intermediate: {
    backgroundColor: "#4ee16b",
    textColor: "black",
    shortenedName: "IM",
  },
  Main: {
    backgroundColor: "#55d1ce",
    textColor: "black",
    shortenedName: "MAIN",
  },
  Advanced: {
    backgroundColor: "#5f6bf6",
    textColor: "white",
    shortenedName: "ADV",
  },
  Invite: {
    backgroundColor: "#e049b2",
    textColor: "white",
    shortenedName: "INV",
  },
});

const isKnownDivision = (division) => typeof division === "string" && RGLDivisionSpecs[division] !== undefined;

const getStableDivision = (freshDivision, cachedDivision) => {
  const hasFreshDivision = isKnownDivision(freshDivision);
  const hasCachedDivision = isKnownDivision(cachedDivision);

  if (hasFreshDivision && freshDivision !== "None") return freshDivision;
  if (hasCachedDivision && cachedDivision !== "None") return cachedDivision;
  if (hasFreshDivision) return freshDivision;
  if (hasCachedDivision) return cachedDivision;

  return "None";
};

const getHighestNumericalDivisionPlayed = (pastTeams, gameMode) => {
  if (pastTeams === undefined || pastTeams === null || pastTeams.length == 0) return RGLDivisions.None;

  let greatestNumericalDivisionPlayed = RGLDivisions.None;
  for (let i = 0; i < pastTeams.length; i++) {
    if (pastTeams[i].formatName != gameMode) continue;

    const divisionName = pastTeams[i].divisionName;
    if (!Object.hasOwn(RGLDivisions, divisionName)) continue; // To account for special division names like "Spec 2-day" from cups
    const numericalValue = RGLDivisions[divisionName];
    if (greatestNumericalDivisionPlayed < numericalValue) {
      greatestNumericalDivisionPlayed = numericalValue;
    }
  }
  return greatestNumericalDivisionPlayed;
};

const getLatestDivisionPlayed = (pastTeams, gameMode) => {
  if (pastTeams === undefined || pastTeams === null || pastTeams.length == 0) return RGLDivisions.None;

  for (let i = 0; i < pastTeams.length; i++) {
    if (pastTeams[i].formatName != gameMode) continue;
    if (!Object.hasOwn(RGLDivisions, divisionName)) continue; // To account for special division names like "Spec 2-day" from cups

    return RGLDivisions[pastTeams[i].divisionName];
  }
  return RGLDivisions.None;
};

// gamemode = "Sixes" or "Highlander"
// getHighestPlayed
// true = get the user's highest division played
// false = latest division played
const getHighestGamemodeTeam = async (gameMode, steamID) => {
  const pastTeams = await getRGLPastTeams(steamID);

  const highestNumericalDivisionPlayed = getHighestNumericalDivisionPlayed(pastTeams, gameMode);
  const latestNumericalDivisionPlayed = getLatestDivisionPlayed(pastTeams, gameMode);
  const highestDivisionString = RGLDivisionsInverse[highestNumericalDivisionPlayed];
  const latestDivisionString = RGLDivisionsInverse[latestNumericalDivisionPlayed];
  return {
    highestDivisionString,
    latestDivisionString,
  };
};

const updateETF2LOnPage = async () => {
  for (let i = 0; i < playerRows.length; i++) {
    const steamID = playerRows[i].id.split("_")[1];
    const resETF2L = await getETF2LProfile(steamID);
    if (!resETF2L) return;

    const leagueElement = playerRows[i].firstChild;

    // Get rid of 'Loading...' message
    leagueElement.innerHTML = "";

    if (resETF2L.status != 200) {
      console.log(resETF2L);
      continue;
    }

    // const data = await resETF2L.json();
    const data = await resETF2L;
    const etf2lLink = document.createElement("a");
    etf2lLink.innerHTML = data.player.name;
    etf2lLink.href = `https://etf2l.org/search/${steamID}/`;
    etf2lLink.target = "_blank";
    etf2lLink.style.backgroundColor = "rgb(144, 238, 144)";
    etf2lLink.style.padding = "6px";
    leagueElement.appendChild(etf2lLink);
  }
};

const updateETF2LNameOnPage = async (steamID, playerInfo, leagueElement) => {
  // Get rid of 'Loading...' message
  leagueElement.innerHTML = "";

  if (!playerInfo.etf2l.name) return;

  const etf2lLink = document.createElement("a");
  etf2lLink.innerHTML = playerInfo.etf2l.name;
  etf2lLink.href = `https://etf2l.org/search/${steamID}/`;
  etf2lLink.target = "_blank";
  etf2lLink.style.backgroundColor = "rgb(144, 238, 144)";
  etf2lLink.style.padding = "6px";
  leagueElement.appendChild(etf2lLink);
};

const updateRGLName = async (steamID, playerInfo, leagueElement) => {
  if (!playerInfo.rgl.name) return;

  const rglLink = document.createElement("a");
  rglLink.href = `https://rgl.gg/Public/PlayerProfile?p=${steamID}`;
  rglLink.target = "_blank";
  rglLink.style.backgroundColor = "rgb(255, 203, 108)";
  rglLink.style.padding = "6px";
  rglLink.style.marginLeft = "10px";

  const banWarning = playerInfo.rgl.isBanned;

  rglLink.innerHTML = playerInfo.rgl.name;

  leagueElement.appendChild(rglLink);

  if (!banWarning) return;

  const banWarningSpan = document.createElement("span");
  banWarningSpan.innerHTML = " (BANNED)";
  rglLink.style.backgroundColor = "rgb(255, 31, 31)";

  rglLink.appendChild(banWarningSpan);
};

const updateRGLDivisionOnPage = async (playerInfo, leagueElement) => {
  if (!playerInfo.rgl.name) return;
  const getHighestDivison = await getHighestDivisionPlayedFlag();
  const division = getHighestDivison ? playerInfo.rgl.division : playerInfo.rgl.latestDivision;

  if (!RGLDivisionSpecs[division]) {
    console.log("Error occurred for " + playerInfo.rgl.name);
    console.log(`The division is not valid. Division: ${division}`);
    return;
  }

  const rglDivisionElement = document.createElement("span");
  rglDivisionElement.style.backgroundColor = RGLDivisionSpecs[division].backgroundColor;
  rglDivisionElement.style.color = RGLDivisionSpecs[division].textColor;
  rglDivisionElement.style.fontWeight = "bold";
  rglDivisionElement.style.minWidth = "40px";
  rglDivisionElement.style.display = "inline-block";
  rglDivisionElement.style.textAlign = "center";
  rglDivisionElement.innerHTML = RGLDivisionSpecs[division].shortenedName;
  rglDivisionElement.style.padding = "6px";
  rglDivisionElement.style.marginLeft = "10px";

  leagueElement.appendChild(rglDivisionElement);
};

const fetchPlayerInfo = async (steamID) => {
  const RGL_profile_data = await getRGLProfile(steamID);
  const ETF2LProfile = await getETF2LProfile(steamID);

  const { highestDivisionString, latestDivisionString } = await getHighestGamemodeTeam("Sixes", steamID);
  if (!highestDivisionString) {

  }
  const localPlayerInfo = window.localStorage.getItem(steamID) ?? null;

  const localPlayerInfoJson = JSON.parse(localPlayerInfo);
  const cachedDivision = localPlayerInfoJson?.rgl?.division;
  const cachedLatestDivision = localPlayerInfoJson?.rgl?.latestDivision;

  const playerInfoToInsert = {
    rgl: {
      name: RGL_profile_data ? RGL_profile_data.name : localPlayerInfoJson ? localPlayerInfoJson.rgl.name : null,
      isBanned: RGL_profile_data
        ? RGL_profile_data.status.isBanned
        : localPlayerInfoJson
          ? localPlayerInfoJson.rgl.isBanned
          : false,
      division: highestDivisionString
        ? getStableDivision(highestDivisionString, cachedDivision)
        : getStableDivision(undefined, cachedDivision),
      latestDivision: getStableDivision(latestDivisionString, cachedLatestDivision),
    },
    etf2l: {
      name: ETF2LProfile ? ETF2LProfile.player.name : localPlayerInfoJson ? localPlayerInfoJson.etf2l.name : null,
    },
  };
  return playerInfoToInsert;
};

const updatePlayerRows = async () => {
  const listOfSteamIDsInStorageThatMightNeedUpdating = [];
  const arrayOfPlayerRows = [...playerRows];
  const listOfSteamIDs = arrayOfPlayerRows.map((playerRow) => playerRow.id.split("_")[1]);

  for (let i = 0; i < listOfSteamIDs.length; i++) {
    const steamID = listOfSteamIDs[i];
    const leagueElement = arrayOfPlayerRows.find((playerRow) => playerRow.id.split("_")[1] == steamID).firstChild;

    const playerInfoStorage = window.localStorage.getItem(steamID);
    let playerInfo;
    if (playerInfoStorage) {
      playerInfo = JSON.parse(playerInfoStorage);
      listOfSteamIDsInStorageThatMightNeedUpdating.push(steamID);
    } else {
      const playerInfoToInsert = await fetchPlayerInfo(steamID);

      window.localStorage.setItem(steamID, JSON.stringify(playerInfoToInsert));
      playerInfo = playerInfoToInsert;
    }

    // true/false
    const showETF2L = await getShowETF2LFlag();
    const showRGL = await getShowRGLFlag();

    showETF2L && updateETF2LNameOnPage(steamID, playerInfo, leagueElement);
    showRGL && updateRGLName(steamID, playerInfo, leagueElement);
    showRGL && updateRGLDivisionOnPage(playerInfo, leagueElement);
  }
  // Profiles have local versions that might need updating
  for (let i = 0; i < listOfSteamIDsInStorageThatMightNeedUpdating.length; i++) {
    const steamID = listOfSteamIDsInStorageThatMightNeedUpdating[i];
    const playerInfoToInsert = await fetchPlayerInfo(steamID);
    window.localStorage.setItem(steamID, JSON.stringify(playerInfoToInsert));
  }
};

const tableBody = document.getElementById("players");

const playerTableHead = tableBody.children[0].firstElementChild;
const playerTableBody = tableBody.children[1];

const rglNameHeader = document.createElement("th");
rglNameHeader.innerHTML = "ETF2L/RGL + 6s Division";

playerTableHead.insertBefore(rglNameHeader, playerTableHead.firstChild);

const playerRows = playerTableBody.children;

for (let i = 0; i < playerRows.length; i++) {
  const leagueData = document.createElement("td");
  // rglName.innerHTML = "Loading...";
  leagueData.innerHTML = "";
  playerRows[i].insertBefore(leagueData, playerRows[i].firstChild);
}

const mainElement = document.getElementsByClassName("container main")[0];
mainElement.style = "width: 1400px !important;";

updatePlayerRows();
