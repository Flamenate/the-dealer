const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Gambler = require("../../models/Systems/Gambler");
const Game = require("../../models/Systems/Game");

const data = new SlashCommandBuilder()
  .setName("togglelock")
  .setDescription("Un/lock game queues.");

module.exports = {
  data: data,
  async execute(interaction) {
    await interaction.deferReply();
    interaction.client.queueLock = !interaction.client.queueLock;
    await Game.updateMany({}, { $set: { queue: [], currently_playing: [] } });
    await Gambler.updateMany(
      {},
      {
        $set: {
          current_game: "",
          queued_for: "",
        },
      }
    );
    await interaction.editReply({
      embeds: [
        new EmbedBuilder({
          description: `${
            interaction.client.queueLock ? "Locked" : "Unlocked"
          } game queues.`,
          color: 0x57f287,
        }),
      ],
    });
  },
};
