const mongoose = require('mongoose');
const twitch = require('./twitch');

async function connectAndUpdate(channelDb) {
  const streamer = channelDb.substring(1);
  mongoose.connect(`mongodb://localhost/${streamer}`);
  const db = mongoose.connection;

  db.on('error', console.error.bind(console, 'connection error:'));

  db.once('open', async function () {
    console.log(`Connected to ${streamer} database`);
    return await timedTaters(channelDb);
  });
}

const taterSchema = new mongoose.Schema({
  username: { type: String, trim: true, unique: true },
  numTaters: { type: Number, min: 0 },
});

const TaterUser = mongoose.model('TaterUser', taterSchema);

async function checkForUser(username) {
  return await TaterUser.findOne({ username: username }, function (err, user) {
    if (err) {
      console.log(`ERROR: ${err}`);
      return false;
    }
    return user;
  });
}

async function addUser(username) {
  let user = await checkForUser(username);
  if (user !== false && user !== null) {
    //console.log(`User ${username} already exists.`);
  } else {
    user = new TaterUser();
    user.username = username;
    user.numTaters = 0;
    user.save(function (err) {
      console.log(`Saving user ${username}. ${err}`);
    });
  }
  return user;
}

async function timedTaters(streamer) {
  chatters = await twitch.getChatters(streamer);
  followers = await twitch.getFollowers(streamer);
  //console.log(`${chatters.length} - ${followers.length}`);
  const taterViewers = [];

  chatters.some((chatter) => {
    followers.some((follower) => {
      if (follower.toLowerCase() === chatter.toLowerCase()) {
        taterViewers.push(chatter);
      }
    });
  });

  let taterUsers = [];
  //console.log(`taterViewers: ${taterViewers}`);
  for (chatter in taterViewers) {
    taterUsers.push(await addUser(taterViewers[chatter]));
  }
  console.log(`Adding taters for viewers who are followers.`);
  for (user in taterUsers) {
    taterUsers[user].numTaters += 10;
    //console.log(`Adding taters to user ${taterUsers[user].username}. Total = ${taterUsers[user].numTaters}`);
    taterUsers[user].save(function (err) {});
  }
}

async function getTaters(channelDb, username, client, target, msg, callback) {
  mongoose.connect(`mongodb://localhost/${channelDb}`);
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'Connection error:'));
  db.once('open', async function () {
    console.log(`Connected to ${channelDb} database`);
    const user = await checkForUser(username);
    if (user) {
      console.log(`returning ${user.numTaters}`);
      callback(client, target, username, msg, user.numTaters);
    } else {
      callback(client, target, username, msg, -1);
    }
  });
}

async function minusTaters(channelDb, username, numBurned) {
  mongoose.connect(`mongodb://localhost/${channelDb}`);
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'Connection error:'));
  db.once('open', async function () {
    console.log(`Subtracting taters for ${username}`);
    const user = await checkForUser(username);
    if (user) {
      user.numTaters -= numBurned;
      user.save(function (err) {});
    }
  });
}

async function addTaters(channelDb, username, numTaters) {
  mongoose.connect(`mongodb://localhost/${channelDb}`);
  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'Connection error:'));
  db.once('open', async function () {
    console.log(`Adding taters for ${username}`);
    const user = await checkForUser(username);
    if (user) {
      user.numTaters += numTaters;
      user.save(function (err) {});
    }
  });
}

module.exports = {
  connectAndUpdate,
  getTaters,
  minusTaters,
  addTaters,
};
