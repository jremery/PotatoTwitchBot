const tmi = require('tmi.js');
const commands = require('./commands.js');
const auth = require('./auth.js');
const server = require('./server.js');
const mongooseDB = require('./mongooseDB');

const STREAMER = 'queenp0tato';

// Define configuration options
const opts = {
  identity: auth.potatoIdentity,
  channels: ['trupajay', 'queenp0tato'],
};

const USER_URL = `https://api.twitch.tv/helix/users?${STREAMER}`;
let USER_ID;

// Create a client with our options
const client = new tmi.client(opts);

let permittedUsers = [];

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Called every time a message comes in
function onMessageHandler(target, context, msg, self) {
  if (self) {
    return;
  } // Ignore messages from the bot

  

  if (msg && msg.startsWith('!')) {
    console.log('Context: ');
    console.log(context);
  }
  // Remove whitespace from chat message
  let commandName = msg.trim().split(' ')[0];

  if (commandName === '!lana') {
    commandName = '!Lana';
  }

  if (commandName === '!permit') {
    userToPermit = msg.trim().split(' ', 2)[1];
    permittedUsers.push(userToPermit.toLowerCase());
    setTimeout(() => { 
      userIndex = permittedUsers.indexOf(userToPermit);
      if (userIndex > -1){
        permittedUsers.splice(userIndex,1);
      }
      console.log(`Removing permit from ${userToPermit}`);
    },120000);
    console.log(`${userToPermit} is permitted to send a link for 120 seconds.`);
    client.say(target, `${context.username} is permitted to send a link for 2 minutes.`);
  }

  if(checkForLink(msg)){
    console.log("A url/link was sent: " + msg);
    console.log(`Permitted users: ${permittedUsers} - context.username: ${context.username}`);
    if (permittedUsers.indexOf(context.username) > -1){
      console.log(`${context.username} is permitted!`);
    } else {
      console.log(`${context.username} is not allowed to post a link. Timeout time.`);
      client.timeout(target, context.username, 1, 'No links allowed unless permitted. Ask a mod before sending a link');
      client.say(target, `Sorry ${context.username}, no links allowed. Ask a mod to permit you before sending a link.`);
    }
  }

  if (target === '#trupajay') {
    console.log(target);
  }

  // If the command is known, let's execute it
  if (commands.listCommands().find((command) => command === commandName)) {
    console.log(`* Executing ${commandName} command`);
    commands
      .getCommands()
      [commandName](client, context, target, msg.trim().split(' ', 2)[1]);
  }

  if (
    context.badges &&
    (context.badges.broadcaster || context.badges.moderator) &&
    commands.listModCommands().find((command) => command === commandName)
  ) {
    console.log(`* Executing ${commandName} command`);
    commands
      .getModCommands()
      [commandName](client, context, target, msg.trim().split(' ', 2)[1]);
  }

  if (
    (context.username === 'trupajay' ||
      context.username === 'jtthealexander') &&
    commands.listTestCommands().find((command) => command === commandName)
  ) {
    console.log(`* Executing ${commandName} command`);
    commands
      .getTestCommands()
      [commandName](client, context, target, msg.trim().split(' ', 2)[1]);
  }

  if (commandName === '!commands') {
    //if (target == '#queenp0tato') {
    let coms = commands.listCommands();
    let string = coms.map((e) => e + '').join(' ');
    string += ' !permit';
    client.say(target, 'Commands: ' + string);
    //}
  }
}

function checkForLink(message) {
  let urlRegex = '^(https?:\\/\\/)?'+ // protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
  '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
  '(\\#[-a-z\\d_]*)?$';
  let found = false;
  let regexMatch;

  message.split(' ').some((word) => {
     regexMatch = word.match(urlRegex);
    if (regexMatch){
      found = true;
    }
    return found;
  });

  return found;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}

function checkForLinkPermit(username) {
  
}

function taterSchedule() {
  console.log('Updating taters!');
  mongooseDB.connectAndUpdate('#queenp0tato');
}

client.connect();
setInterval(taterSchedule, 10 * 60 * 1000);
