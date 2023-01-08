const { SlashCommandBuilder } = require("discord.js");
const Chinchiro = require("../../models/Games/Chinchiro");
const { generateUID } = require("../../utils/random");

const data = new SlashCommandBuilder()
  .setName("chinchiro")
  .setDescription("Chinchiro")
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
    const game = new Chinchiro(
      uid,
      interaction.channel,
      interaction.options.getUser("p1"),
      interaction.options.getUser("p2")
    );
    interaction.client.games.chinchi[uid] = game;
    game.sendPrompts();

    await interaction.reply({ content: "Game Created.", ephemeral: true });
  },
};
