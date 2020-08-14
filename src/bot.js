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
  
  if (commandName === '!lana'){
    commandName = '!Lana';
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
    (context.username === 'trupajay' || context.username === 'jtthealexander') &&
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
    client.say(target, 'Commands: ' + string);
    //}
  }
}

// Called every time the bot connects to Twitch chat
function onConnectedHandler(addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}

function taterSchedule(){
  console.log('Updating taters!');
  mongooseDB.connectAndUpdate('#queenp0tato');
}

client.connect();

setInterval(taterSchedule, 10 * 60 * 1000);