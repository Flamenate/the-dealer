require("dotenv").config();
const env = process.env;

const { readdirSync } = require("fs");
const { Client, Collection, GatewayIntentBits } = require("discord.js");
const mongoose = require("mongoose");
const Logger = require("./utils/Logger");
const Bet = require("./models/Systems/Bet");
const Loan = require("./models/Systems/Loan");
const moment = require("moment");

mongoose.Schema.Types.String.checkRequired((v) => v != null); //allow empty strings in string fields
mongoose.connect(env.MONGO_URI);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
});

client.commands = new Collection();
const cmdDirs = readdirSync("./commands/");
for (const dirName of cmdDirs) {
  const files = readdirSync(`./commands/${dirName}`).filter((file) =>
    file.endsWith(".js")
  );
  for (const filename of files) {
    const command = require(`./commands/${dirName}/${filename}`);
    if (!command.data || command.disabled) continue;
    command.category = dirName;
    client.commands.set(command.data.name, command);
  }
}

const evtDirs = readdirSync("./events/");

for (const dirName of evtDirs) {
  const files = readdirSync(`./events/${dirName}`).filter((file) =>
    file.endsWith(".js")
  );
  for (const filename of files) {
    const event = require(`./events/${dirName}/${filename}`);
    if (event.once)
      client.once(event.name, (...args) => event.execute(...args));
    else client.on(event.name, (...args) => event.execute(...args));
  }
}

client.once("ready", async () => {
  client.logger = new Logger("errors.log");
  const guild = client.guilds.cache.get(env.MAIN_GUILD_ID);
  await guild.members.fetch(); //for caching purposes

  client.activeVotes = {};
  client.games = {
    basket: {},
    orlog: {},
    spy: {},
    treasure: {},
    esc: {},
    general: {},
    kmc: {},
    bvs: {},
    poke: {},
    chinchi: {},
    chakra: {},
  };

  const betChannel = guild.channels.cache.get(env.BET_CHANNEL_ID);
  for (const bet of await Bet.find({ winning_option: { $eq: "" } })) {
    bet.scheduleEdits(await betChannel.messages.fetch(bet.msg_id));
  }
  for (const loan of await Loan.find()) {
    if (loan.remaining_amount == 0) continue;
    const repaymentDate = moment().add(loan.duration, "minutes");
    if (repaymentDate.isBefore()) {
      loan.scheduleRepayment(user);
      continue;
    }
    let member;
    try {
      member = await guild.members.fetch(loan.gambler.account_id);
    } catch (error) {
      await Loan.deleteOne({ _id: loan._id });
      continue;
    }
    const user = await loan.repay(member);
  }

  client.queueLock = false;
  console.log(`Logged in as ${client.user.tag}`);
});

client.login(env.BOT_TOKEN);
