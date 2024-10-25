const isFirefox = typeof browser !== "undefined";
const currentBrowser = isFirefox ? browser : chrome;
const timer = (ms) => new Promise((res) => setTimeout(res, ms));

const checkForErrors = (response) => {
  if (response.status === 429) {
    console.log("Rate limited for the following request");
    console.log(response);
    return true;
  }
  if (!response.ok) {
    return true;
  }

  return false;
}

const getRGLPastTeams = async (steamID) => {
  const uri = `https://api.rgl.gg/v0/profile/${steamID}/teams`;

  await timer(1500);
  const response = await fetch(uri);
  if (checkForErrors(response)) return;

  return await response.json();
}

const getRGLProfile = async (steamID) => {
  const uri = `https://api.rgl.gg/v0/profile/${steamID}`;

  await timer(1500);
  const response = await fetch(uri);
  if (checkForErrors(response)) return;

  return await response.json();
};

const GetETF2LProfile = async (steamID) => {
  const uriETF2L = `https://api-v2.etf2l.org/player/${steamID}`;

  await timer(500);
  const response = await fetch(uriETF2L);
  if (checkForErrors(response)) return;

  return await response.json();
};

const getAllData = async (steamID, messageType) => {
  let data;
  if (messageType === "rgl_profile") {
    data = await getRGLProfile(steamID);
  } else if (messageType === "etf2l_profile") {
    data = await GetETF2LProfile(steamID);
  } else if (messageType === "rgl_past_teams") {
    data = await getRGLPastTeams(steamID);
  }
  return data;
};

currentBrowser.runtime.onInstalled.addListener(async () => {
  await currentBrowser.storage.local.set({ showRGL: true });
  await currentBrowser.storage.local.set({ showETF2L: true });
  await currentBrowser.storage.local.set({ getHighestDivisionPlayed: true });
});

currentBrowser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  getAllData(message.steamID, message.type).then((data) => sendResponse(data));
  return true;
});
