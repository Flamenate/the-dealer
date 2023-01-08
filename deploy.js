require("dotenv").config();
const env = process.env;
const { readdirSync } = require("fs");
const { REST } = require("discord.js");
const { Routes } = require("discord-api-types/v10");

const commands = [];
const dirs = readdirSync(`./commands/`);
for (const dirName of dirs) {
  const files = readdirSync(`./commands/` + dirName).filter((file) =>
    file.endsWith(".js")
  );
  for (const filename of files) {
    const command = require(`./commands/${dirName}/${filename}`);
    if (!command.data || command.disabled) continue;
    commands.push(command.data.toJSON());
    console.log("Processed: " + filename);
  }
}

const rest = new REST({ version: "10" }).setToken(env.BOT_TOKEN);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(
      Routes.applicationGuildCommands(env.CLIENT_ID, env.MAIN_GUILD_ID),
      {
        body: commands,
      }
    );

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();
