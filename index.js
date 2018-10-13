// Load up the discord.js library
const Discord = require("discord.js");
const CronJob = require('cron').CronJob;
const fs = require('fs');
const util = require('util');

// This is your client. Some people call it `bot`, some people call it `self`, 
// some might call it `cootchie`. Either way, when you see `client.something`, or `bot.something`,
// this is what we're refering to. Your client.
const client = new Discord.Client();

// Here we load the config.json file that contains our token and our prefix values. 
const config = require("./config.json");
// config.token contains the bot's token
// config.prefix contains the message prefix.

const reminder = [];
const TIMEZONE = 'Pacific/Auckland';
const CRON_LENGTH = 6;

// const saveReminders = () => {
//     util.promisify(fs.writeFile)('./reminders.json', JSON.stringify(reminder.map(val => val.crontab)));
// };

// const loadReminders = async () => {
//     const file = await util.promisify(fs.readFile)('./reminders.json');

//     {
//         crontab,
//         'job': new CronJob(crontab, async () => {
//             await message.channel.send(content);
//         }, null, true, TIMEZONE)
//     }
    
//     JSON.parse(file).forEach(element => {
        
//     });;
// };

const onMessage = async message => {
    // This event will run on every single message received, from any channel or DM.

    // It's good practice to ignore other bots. This also makes your bot ignore itself
    // and not get into a spam loop (we call that "botception").
    if (message.author.bot) {
        return;
    }

    // Also good practice to ignore any message that does not start with our prefix, 
    // which is set in the configuration file.
    if (message.content.indexOf(config.prefix) !== 0) return;

    // Here we separate our "command" name, and our "arguments" for the command. 
    // e.g. if we have the message "+say Is this the real life?" , we'll get the following:
    // command = say
    // args = ["Is", "this", "the", "real", "life?"]
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    // Let's go with a few common example commands! Feel free to delete or change those.

    if (command === "ping") {
        // Calculates ping between sending a message and editing it, giving a nice round-trip latency.
        // The second ping is an average latency between the bot and the websocket server (one-way, not round-trip)
        const m = await message.channel.send("Ping?");
        m.edit(`Pong! Latency is ${m.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ping)}ms`);
    }

    if (command === "remindme") {
        if (args.length > CRON_LENGTH) {
            if (reminder !== null && reminder instanceof CronJob) {
                reminder.stop();
            }
            
            const crontab = args.slice(0, CRON_LENGTH).join(' ');
            const content = args.slice(CRON_LENGTH, args.length).join(' ');

            reminder.push({
                crontab,
                'job': new CronJob(crontab, async () => {
                    await message.channel.send(content);
                }, null, true, TIMEZONE)
            });

            // await saveReminders();

            await message.channel.send("Reminder has been created on this channel");
        } else {
            await message.channel.send("Expected ```remindme <crontab> <message>```");
        }
    }

    if (command === "listremindme") {
        const reminderList = [];
        for (let i = 0; i < reminder.length; i += 1) {
            reminderList.push(`${i.toString()}. ${reminder[i].crontab}`);
        }
        await message.channel.send(`Here are your reminders:\n\n${reminderList.join('\n')}`);
    }

    if (command === "stopremindme") {
        const reminderIndex = parseInt(args.shift(), 10);
        reminder[reminderIndex].job.stop();
        reminder.splice(reminderIndex, 1);
        await message.channel.send("Reminder stopped");
    }
};

client.on("ready", () => {
    // This event will run if the bot starts, and logs in, successfully.
    console.log(`Bot has started, with ${client.users.size} users, in ${client.channels.size} channels of ${client.guilds.size} guilds.`);
    // Example of changing the bot's playing game to something useful. `client.user` is what the
    // docs refer to as the "ClientUser".
    client.user.setActivity(`Serving ${client.guilds.size} servers`);

    // await loadReminders();

    client.on("message", onMessage);
});

client.on("guildCreate", guild => {
    // This event triggers when the bot joins a guild.
    console.log(`New guild joined: ${guild.name} (id: ${guild.id}). This guild has ${guild.memberCount} members!`);
    client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on("guildDelete", guild => {
    // this event triggers when the bot is removed from a guild.
    console.log(`I have been removed from: ${guild.name} (id: ${guild.id})`);
    client.user.setActivity(`Serving ${client.guilds.size} servers`);
});

client.on("error", e => console.error(e));

client.on("warn", e => console.warn(e));

client.login(config.token);
