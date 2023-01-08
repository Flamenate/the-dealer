const { ensureDocument } = require("../../utils/ensure");
const Game = require("../../models/Systems/Game");
const { EmbedBuilder } = require("discord.js");
const Gambler = require("../../models/Systems/Gambler");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (interaction.customId != "queueMenu") return;
    const gambler = await ensureDocument(interaction);

    const game = await Game.findById(interaction.values[0]);
    await Game.updateOne({ _id: game._id }, { $push: { queue: gambler._id } });

    await Gambler.updateOne(
      { _id: gambler._id },
      { $set: { queued_for: game._id } }
    );

    interaction.component.setDisabled(true);
    await interaction.update({
      embeds: [
        new EmbedBuilder({
          description: `You queued up for **${game._id}** with **${
            game.queue.length
          } ${game.queue.length != 1 ? "people" : "person"}**.`,
          color: 0x57f287,
        }),
      ],
      components: [interaction.message.components[0]],
    });
  },
};
