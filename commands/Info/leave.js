const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ensureDocument } = require("../../utils/ensure");
const Game = require("../../models/Systems/Game");
const { ErrorEmbed } = require("../../utils/embeds");
const Gambler = require("../../models/Systems/Gambler");

const data = new SlashCommandBuilder()
  .setName("leave")
  .setDescription("Leave the queue");

module.exports = {
  data: data,
  async execute(interaction) {
    const gambler = await ensureDocument(interaction);
    if (!gambler.queued_for)
      return await interaction.reply({
        embeds: [new ErrorEmbed("You're not in any queue!")],
        ephemeral: true,
      });

    const game = await Game.findById(gambler.queued_for);
    await Game.updateOne(
      { _id: game._id },
      {
        $set: {
          queue: game.queue.filter((oid) => !oid.equals(gambler._id)),
        },
      }
    );

    await Gambler.updateOne({ _id: gambler._id }, { $set: { queued_for: "" } });

    await interaction.reply({
      embeds: [
        new EmbedBuilder({
          description: `You left the queue for **${game._id}**.`,
          color: 0x57f287,
        }),
      ],
      ephemeral: true,
    });
  },
};
