const { SlashCommandBuilder } = require("discord.js");
const KMC = require("../../models/Games/KMC");
const { generateUID } = require("../../utils/random");

const data = new SlashCommandBuilder()
  .setName("kmc")
  .setDescription("Kumo no Canzone")
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
    const game = new KMC(
      uid,
      interaction.channel,
      interaction.options.getUser("p1"),
      interaction.options.getUser("p2")
    );
    interaction.client.games.kmc[uid] = game;
    game.inverseRoles();

    await interaction.reply({ content: "Game Created.", ephemeral: true });
  },
};
