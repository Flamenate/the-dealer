const Game = require("../../models/Systems/Game");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (interaction.customId != "infoMenu") return;

    const game = await Game.findById(interaction.values[0]);

    const embed = new EmbedBuilder({
      title: game._id,
      description: game.description,
      image: { url: game.img },
      color: 0x9b59b6,
    });

    await interaction.update({
      embeds: [embed],
    });
  },
};
