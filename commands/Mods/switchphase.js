const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Game = require("../../models/Systems/Game");

const data = new SlashCommandBuilder()
  .setName("switchphase")
  .setDescription("Switch game phases.");

module.exports = {
  data: data,
  async execute(interaction) {
    await interaction.deferReply();
    for (const game of await Game.find()) {
      game.active = !game.active;
      game.save();
    }
    await interaction.editReply({
      embeds: [
        new EmbedBuilder({
          description: "Phases Switched.",
          color: 0x57f287,
        }),
      ],
    });
  },
};
