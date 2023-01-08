const { SlashCommandBuilder } = require("discord.js");
const General = require("../../models/Games/General");
const { generateUID } = require("../../utils/random");

const data = new SlashCommandBuilder()
  .setName("general")
  .setDescription("Great General")
  .addUserOption((opt) =>
    opt.setName("p1").setDescription("Player 1").setRequired(true)
  )
  .addUserOption((opt) =>
    opt.setName("p2").setDescription("Player 2").setRequired(true)
  );

module.exports = {
  data: data,
  async execute(interaction) {
    const uid = generateUID();
    const game = new General(
      uid,
      interaction.channel,
      interaction.options.getUser("p1"),
      interaction.options.getUser("p2")
    );
    interaction.client.games.general[uid] = game;
    game.buyPrompt("p1");
    game.buyPrompt("p2");

    await interaction.reply({ content: "Game Created.", ephemeral: true });
  },
};
