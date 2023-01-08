const Bet = require("../../models/Systems/Bet");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("lockbet")
  .setDescription("Lock a bet.")
  .addStringOption((opt) =>
    opt
      .setName("message_id")
      .setDescription("Message ID of the bet you want to end")
      .setRequired(true)
  );

module.exports = {
  data: data,
  async execute(interaction) {
    const bet = await Bet.findOneAndUpdate(
      {
        msg_id: interaction.options.getString("message_id"),
      },
      { $set: { locked: true } }
    );

    await interaction.reply({
      embeds: [
        new EmbedBuilder({
          title: `${bet.game} Bet`,
          description: "Bet locked successfully.",
        }),
      ],
      ephemeral: true,
    });
  },
};
