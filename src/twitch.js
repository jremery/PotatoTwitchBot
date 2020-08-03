const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { catchAsync } = require('./utils');
const fs = require('fs');
const querystring = require('querystring');
const auth = require('./auth');

const CLIENT_ID = auth.CLIENT_ID;
const CLIENT_SECRET = auth.CLIENT_SECRET;

const TOKEN_FILE_PATH = './token.json';

const redirect = encodeURIComponent(
  'http://localhost:8081/api/twitch/callback'
);

const FOLLOWS_URL = 'https://api.twitch.tv/helix/users/follows';
const USERS_URL = 'https://api.twitch.tv/helix/users';

router.get('/login', (req, res) => {
  res.redirect(
    `https://id.twitch.tv/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirect}&response_type=code&scope=user:read:email`
  );
});

router.get(
  '/callback',
  catchAsync(async (req, res) => {
    if (!req.query.code) throw new Error('NoCodeProvided');
    const code = req.query.code;
    const postBody = {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: code,
      grant_type: authorization_code,
      redirect_uri: redirect,
    };
    const response = await fetch(`https://id.twitch.tv/oauth2/token`, {
      method: 'POST',
      body: JSON.stringify(postBody),
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await response.json();
    const tokenInfo = JSON.stringify(json);

    saveToken(tokenInfo);
    res.redirect(`/?token=${json.access_token}`);
  })
);

router.get(
  '/refresh',
  catchAsync(async (req, res) => {
    const refresh = req.query.refresh;
    console.log('refresh:');
    console.log(refresh);
    const body = {
      refresh_token: refresh,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'refresh_token',
    };

    const response = await fetch(`https://id.twitch.tv/oauth2/token`, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    });
    console.log(response);
    const json = await response.json();
    const tokenInfo = JSON.stringify(json);

    saveToken(tokenInfo);
    res.redirect(`/?token=${json.access_token}`);
  })
);

async function saveToken(tokenInfo) {
  if (fs.existsSync(TOKEN_FILE_PATH)) {
    // check for expired and refresh
    console.log('Token was already aquired, overwriting.');
  } else {
    console.log('New token saved.');
  }
  fs.writeFile(TOKEN_FILE_PATH, tokenInfo, function (err) {
    if (err) console.log(err);
    console.log('Token saved.');
  });
}

async function refreshToken(oldJSON) {
  const localURL = `http://localhost:8081/api/twitch/refresh?refresh=${oldJSON.refresh_token}`;
  const res = await fetch(localURL);
  const newToken = fs.readFileSync(TOKEN_FILE_PATH, { flag: 'r' });
  const newJSON = JSON.parse(newToken);
  return newJSON;
}

async function getToken() {
  const data = fs.readFileSync(TOKEN_FILE_PATH, { flag: 'r' });
  const curJSON = JSON.parse(data);

  let returnJSON = curJSON;

  // check for refresh
  var stats = fs.statSync(TOKEN_FILE_PATH);
  const seconds = (new Date().getTime() - stats.mtime) / 1000;
  if (seconds > curJSON.expires_in) {
    console.log('refreshing token');
    newJSON = refreshToken(curJSON);
    returnJSON = newJSON;
  }
  return returnJSON;
}

async function getUserId(streamer) {
  streamer = streamer.substring(1);
  const fetchArgs = await getFetchArgs();
  const qsStreamer = querystring.stringify({
    login: streamer,
  });
  const qUrlStreamer = `${USERS_URL}?${qsStreamer}`;
  let streamerId = '';
  return await fetch(qUrlStreamer, fetchArgs)
    .then((res) => res.json())
    .then((data) => {
      if (data.data[0]) {
        return data.data[0].id;
      }
    })
    .catch((err) => console.error(err));
}

async function getFollowers(streamer) {
  const fetchArgs = await getFetchArgs();
  return await getUserId(streamer).then(async (streamerId) => {
    console.log(`StreamerId: ${streamerId}`);
    const qsStreamer = querystring.stringify({
      to_id: streamerId,
      first: 100,
    });

    const qUrlStreamer = `${FOLLOWS_URL}?${qsStreamer}`;
    const total = await fetch(qUrlStreamer, fetchArgs)
      .then((res) => res.json())
      .then((data) => {
        if (data.data && data.data[0]) {
          return data.total;
        }
      })
      .catch((err) => console.error(err));
    let followers = [];
    let cursor = '';
    while (followers.length < total) {
      const res = await getNextPageOfFollowers(cursor, streamerId, fetchArgs);
      followers = followers.concat(res[0]);
      cursor = res[1];
    }
    return followers;
  });
}

async function getNextPageOfFollowers(cursor, streamerId, fetchArgs) {
  const qsStreamer = querystring.stringify({
    to_id: streamerId,
    first: 100,
    after: cursor,
  });

  const qUrlStreamer = `${FOLLOWS_URL}?${qsStreamer}`;
  return await fetch(qUrlStreamer, fetchArgs)
    .then((res) => res.json())
    .then((data) => {
      if (data.data[0]) {
        let followers = [];
        data.data.forEach((user) => {
          followers.push(user.from_name);
        });
        return [followers, data.pagination.cursor];
      }
    })
    .catch((err) => console.error(err));
}

async function getFollowage(streamer, userId) {
  const fetchArgs = await getFetchArgs();
  return await getUserId(streamer).then((streamerId) => {
    const qsStreamer = querystring.stringify({
      to_id: streamerId,
      from_id: userId,
    });

    const qUrlStreamer = `${FOLLOWS_URL}?${qsStreamer}`;
    return fetch(qUrlStreamer, fetchArgs)
      .then((res) => res.json())
      .then((data) => {
        if (data.data[0]) {
          return data.data[0].followed_at;
        } else {
          return -1;
        }
      })
      .catch((err) => console.error(err));
  });
}

async function getChatters(streamer) {
  const streamViewerUrl = `https://tmi.twitch.tv/group/user/${streamer.substring(1)}/chatters`;
  return fetch(streamViewerUrl)
    .then((res) => res.json())
    .then((data) => {
      let chat = data.chatters;
      let vips = chat.vips;
      let moderators = chat.moderators;
      let staff = chat.staff;
      let viewers = chat.viewers;
      const chatters = vips.concat(moderators, staff, viewers);
      console.log(`chatters: ${JSON.stringify(chatters)}`)
      return chatters;
    })
    .catch((err) => console.log(err));
}

async function getFetchArgs() {
  const token = await getToken();
  const access_token = token.access_token;
  const fetchArgs = {
    headers: {
      'Client-ID': CLIENT_ID,
      Authorization: 'Bearer ' + access_token,
    },
  };
  return fetchArgs;
}

module.exports = {
  router,
  getToken,
  getFollowers,
  getFollowage,
  getChatters,
};
