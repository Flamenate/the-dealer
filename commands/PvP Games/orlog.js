const { SlashCommandBuilder } = require("discord.js");
const Orlog = require("../../models/Games/Orlog");
const { generateUID } = require("../../utils/random");

const data = new SlashCommandBuilder()
  .setName("orlog")
  .setDescription("Orlog")
  .addUserOption((opt) =>
    opt.setName("p1").setDescription("Mention the 1st player").setRequired(true)
  )
  .addUserOption((opt) =>
    opt.setName("p2").setDescription("Mention the 2nd player").setRequired(true)
  );

module.exports = {
  data: data,
  async execute(interaction) {
    const uid = generateUID();
    const game = new Orlog(
      uid,
      interaction.channel,
      interaction.options.getUser("p1"),
      interaction.options.getUser("p2")
    );
    interaction.client.games.orlog[uid] = game;

    game.advance();
    await interaction.reply({ content: "Game Created.", ephemeral: true });
  },
};
