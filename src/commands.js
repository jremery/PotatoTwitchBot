const fetch = require('node-fetch');
const querystring = require('querystring');
const twitch = require('./twitch');
const mongooseDB = require('./mongooseDB');
const auth = require('./auth');

let commands = {};
let modCommands = {};
let testCommands = {};

// users in chat here = https://tmi.twitch.tv/group/user/USERNAMEHERE/chatters

const CLIENT_ID = auth.CLIENT_ID;
const STREAMS_URL = 'https://api.twitch.tv/helix/streams';
const USERS_URL = 'https://api.twitch.tv/helix/users';

const qsQueen = querystring.stringify({
  user_login: 'queenp0tato',
});

const qsTrupa = querystring.stringify({
  user_login: 'TrupaJay',
});

const qUrlQueen = `${STREAMS_URL}?${qsQueen}`;
const qUrlTrupa = `${STREAMS_URL}?${qsTrupa}`;

let duelUsers = [];

addCommand('!dice', (client, context, target, msg) => {
  const num = rollDice();
  client.say(target, `You rolled a ${num}`);
  console.log(`* Executed !dice command`);
});

addCommand('!discord', (client, context, target, msg) => {
  if (target == '#queenp0tato') {
    client.say(
      target,
      'Join queenp0tato on her discord! https://discord.gg/jwW33NY'
    );
  }
});

addCommand('!stats', (client, context, target, msg) => {
  if (target == '#queenp0tato') {
    client.say(
      target,
      "Check out queenp0tato's stats at https://battlefieldtracker.com/bfv/profile/origin/queenp0tato/overview"
    );
  }
});

addCommand('!uptime', async (client, context, target, msg) => {
  const tokenJSON = await twitch.getToken();
  const access_token = tokenJSON.access_token;
  const fetchArgs = {
    headers: {
      'Client-ID': CLIENT_ID,
      Authorization: 'Bearer ' + access_token,
    },
  };
  if (target == '#queenp0tato') {
    fetch(qUrlQueen, fetchArgs)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        if (data.data[0]) {
          const uptime = calcUptime(data.data[0].started_at);
          client.say(target, 'Queenp0tato has been live for: ' + uptime);
        }
      })
      .catch((err) => console.error(err));
  }
  if (target == '#trupajay') {
    fetch(qUrlTrupa, fetchArgs)
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        if (data.data[0]) {
          const uptime = calcUptime(data.data[0].started_at);
          client.say(target, 'TrupaJay has been live for: ' + uptime);
        } else {
          client.say(target, 'TrupaJay is not currently live.');
        }
      })
      .catch((err) => console.error(err));
  }
});

addCommand('!donate', (client, context, target, msg) => {
  if (target == '#queenp0tato') {
    client.say(
      target,
      'You can donate to queenp0tato here: https://streamlabs.com/queenp0tato'
    );
  }
});

addCommand('!twitter', (client, context, target, msg) => {
  if (target == '#queenp0tato') {
    client.say(
      target,
      'Follow queenp0tato on Twitter here: https://www.twitter.com/queenp0tato'
    );
  }
});

addCommand('!sens', (client, context, target, msg) => {
  if (target === '#queenp0tato') {
    client.say(target, 'Queenp0tato uses 800 DPI and 13 in-game sens for BFV.');
  }
});

addCommand('!ban', (client, context, target, msg) => {
  if (target === '#queenp0tato') {
    client.say(target, `I'd ban ${msg} but The Queen has final say.`);
  }
});

addCommand('!time', (client, context, target, msg) => {
  if (target == '#queenp0tato') {
    time = new Date();
    client.say(
      target,
      'The current time for queenp0tato is ' +
        time.getHours() +
        ':' +
        (time.getMinutes() < 10 ? '0' : '') +
        time.getMinutes()
    );
  }
});

addCommand('!followage', async (client, context, target, msg) => {
  const followed_at = await twitch.getFollowage(target, context['user-id']);
  if (followed_at !== -1) {
    const followed_diff = calcFollowage(followed_at);
    if (followed_diff.length > 0) {
      client.say(
        target,
        `You have followed ${target.substring(1)} for ${followed_diff}!`
      );
    } else {
      client.say(
        target,
        `You have followed ${target.substring(1)} for less than an hour.`
      );
    }
  } else {
    client.say(target, `You aren't following ${target.substring(1)} PepeHands`);
  }
});

addCommand('!Lana', (client, context, target, msg) => {
  //if (target == '#queenp0tato') {
  client.say(
    target,
    'queenp14Blep <3 queenp14Blep <3 queenp14Blep <3 queenp14Blep <3 queenp14Blep <3 queenp14Blep <3 queenp14Blep <3 queenp14Blep <3 queenp14Blep <3 queenp14Blep <3 queenp14Blep <3 queenp14Blep <3 queenp14Blep'
  );
  //}
});

addCommand('!taters', async (client, context, target, msg) => {
  msg = msg.trim().split(' ', 2)[1];
  await mongooseDB.getTaters(
    target.substring(1),
    context.username,
    client,
    target,
    msg,
    printTaters
  );
});

addCommand('!rules', async (client, context, target, msg) => {
  client.say(
    target,
    '- Be respectful and open minded... No racist/sexist/ homophobic slurs or insults - English only - No links. Ask a mod for permission or join the !discord to share media - Refrain from excessive spamming - No politics'
  );
});

addCommand('!lurk', async (client, context, target, msg) => {
  client.say(
    target,
    `${context.username} is now lurking on the farm, growing more taters.`
  )
});

addModCommand('!so', async (client, context, target, msg) => {
  msg = msg.trim().split(' ', 2)[1];
  let qsLookup = querystring.stringify({
    login: msg,
  });
  const tokenJSON = await twitch.getToken();
  const access_token = tokenJSON.access_token;
  console.log('access_token: ' + access_token);
  if (!access_token) return;

  const newFetchArgs = {
    headers: {
      'Client-ID': CLIENT_ID,
      Authorization: 'Bearer ' + access_token,
    },
  };

  let lookupUrl = `${USERS_URL}?${qsLookup}`;
  await fetch(lookupUrl, newFetchArgs)
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      if (data.data.length > 0) {
        client.say(
          target,
          `Check out some non-potato gameplay with ${msg}! twitch.tv/${msg}`
        );
      } else {
        client.say(target, `Sorry, streamer ${msg} not found.`);
      }
    })
    .catch((err) => console.log('Error: ' + err));
});

addTestCommand('!followers', async (client, context, target, msg) => {
  await twitch.getFollowers('#queenp0tato').then((followers) => {
    followers.forEach((user) => {
      console.log(user);
    });
  });
});

addTestCommand('!duel', async (client, context, target, msg) => {
  const userToDuel = msg.trim().split(' ', 3)[1];
  const duelWager = msg.trim().split(' ', 3)[2];
  if(msg.trim().split(' ', 3).length != 3){
    client.say(target, `Wrong format ${context.username}, use !duel name number`);
    return;
  }
  if (isNaN(duelWager)){
    client.say(target, `${context.username} ${duelWager} is not a number. Use !duel name number`);
    return;
  }

  chatters = await twitch.getChatters(target);
  console.log(chatters.indexOf(userToDuel));
  if (chatters.indexOf(userToDuel) < 0){
    client.say(target, `${userToDuel} is not in the chat, ${context.username}.`);
    return;
  }

  // check if user has enough taters

  client.say(target, `${userToDuel}, you have been challenged to a potato food fight by ${context.username} for ${duelWager} taters! Enter !accept within 2 minutes to mash taters!`);
  const duel = {challenger: context.username, user: userToDuel, wager: duelWager};
  duelUsers.push(duel);
  // set timeout to remove from list after 2 mins

});

addTestCommand('!accept', async (client, context, target, msg) => {
  // check if user is in duel list

  // check if user has enough taters

  // random number to each, delay then decide winner
  
  // remove taters from loser, add to winner
  
  // respond with winner
});

addModCommand('!title', async (client, context, target, msg) => {
  args = msg.trim().split(' ');
  let allArgs = '';
  for (var i = 1; i < args.length; i++) {
    if (i + 1 < args.length) {
      allArgs += args[i] + ' ';
    } else {
      allArgs += args[i];
    }
  }
  const res = await twitch.updateTitle(target, allArgs);
  if (res === 204){
    client.say(target, `Updated title to "${allArgs}"`);
  } else {
    client.say(target, `Sorry there was a problem updating title.`);
  }
});

addModCommand('!game', async (client, context, target, msg) => {
  args = msg.trim().split(' ');
  let allArgs = '';
  for (var i = 1; i < args.length; i++) {
    if (i + 1 < args.length) {
      allArgs += args[i] + ' ';
    } else {
      allArgs += args[i];
    }
  }
  const res = await twitch.updateGame(target, allArgs);
  if (res === 204){
    client.say(target, `Updated game to "${allArgs}"`);
  } else {
    client.say(target, `Sorry there was a problem updating the game.`);
    console.log(res);
  }
}); 

addCommand('!cook', async (client, context, target, msg) => {
  msg = msg.trim().split(' ', 2)[1];
  await mongooseDB.getTaters(
    target.substring(1),
    context.username,
    client,
    target,
    msg,
    cookTaters
  );
});

function cookTaters(client, target, username, msg, numTaters) {
  if (numTaters === -1) {
    client.say(
      target,
      `You don't have any Taters ${username} :( Be sure to follow ${target.substring(
        1
      )} and watch to get Taters every 10 minutes.`
    );
  } else {
    let numToCook = parseInt(msg);
    console.log(`NumToCook: ${numToCook}`);
    if (isNaN(numToCook) && msg != 'all') {
      client.say(target, `${username} that is not a number.`);
      return;
    }
    if (msg === 'all'){
      numToCook = numTaters;
    }

    if (numToCook > numTaters) {
      client.say(target, `${username} you only have ${numTaters} to cook.`);
    } else {
      const cookChance = Math.random();
      if (cookChance < 0.45) {
        client.say(
          target,
          `Oh no, your ${numToCook} Taters were burned ${username} PepeHands`
        );
        mongooseDB.minusTaters(target.substring(1), username, numToCook);
      } else if (cookChance > 0.45 && cookChance < 0.55) {
        client.say(
          target,
          `I forgot to turn on the burner, have your Taters back ${username}`
        );
      } else {
        client.say(
          target,
          `Your Taters were cooked so good they multiplied! ${username} you now have ${
            numToCook + numTaters
          } Taters!`
        );
        mongooseDB.addTaters(target.substring(1), username, numToCook);
      }
    }
  }
}

function printTaters(client, target, username, msg, numTaters) {
  console.log(`NUMTATERS: ${numTaters}`);
  if (numTaters === -1) {
    client.say(
      target,
      `You don't have any Taters ${username} :( Be sure to follow ${target.substring(
        1
      )} and watch to get Taters every 10 minutes.`
    );
  } else {
    client.say(target, `You have ${numTaters.toString()} Taters ${username}!`);
  }
}

function addTestCommand(commandName, func) {
  testCommands[commandName] = func;
}

function addModCommand(commandName, func) {
  modCommands[commandName] = func;
}

function addCommand(commandName, func) {
  commands[commandName] = func;
}

module.exports.getCommands = function getCommands() {
  return commands;
};

module.exports.getTestCommands = function getTestCommands() {
  return testCommands;
};

module.exports.getModCommands = function getModCommands() {
  return modCommands;
};

module.exports.listCommands = function listCommands() {
  return Object.keys(commands);
};

module.exports.listTestCommands = function listTestCommands() {
  return Object.keys(testCommands);
};

module.exports.listModCommands = function listModCommands() {
  return Object.keys(modCommands);
};

// Function called when the "dice" command is issued
function rollDice() {
  const sides = 6;
  return Math.floor(Math.random() * sides) + 1;
}

function calcFollowage(followed_at) {
  const start = new Date(followed_at);
  const now = new Date();

  const elapsed = now - start;

  const days = Math.floor(elapsed / (1000 * 60 * 60 * 24));
  const hours = Math.floor((elapsed / (1000 * 60 * 60)) % 24);
  let followage = '';
  if (days > 0 || hours > 0) {
    followage =
      (days > 0 ? `${days} days ` : '') + (hours > 0 ? `${hours} hours` : '');
  }
  return followage;
}

function calcUptime(startedAt) {
  const start = new Date(startedAt);
  const now = new Date();

  const elapsed = now - start;

  const seconds = Math.floor((elapsed / 1000) % 60);
  const minutes = Math.floor((elapsed / (1000 * 60)) % 60);
  const hours = Math.floor((elapsed / (1000 * 60 * 60)) % 24);

  const uptime =
    (hours > 0 ? `${hours}h ` : '') +
    (minutes > 0 ? `${minutes}m ` : '') +
    (seconds > 0 ? `${seconds}s` : '0s');
  return uptime;
}
