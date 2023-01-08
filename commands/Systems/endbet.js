const Bet = require("../../models/Systems/Bet");
const { ErrorEmbed } = require("../../utils/embeds");
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("endbet")
  .setDescription("End a bet.")
  .addStringOption((opt) =>
    opt
      .setName("message_id")
      .setDescription("Message ID of the bet you want to end")
      .setRequired(true)
  );

module.exports = {
  data: data,
  async execute(interaction) {
    const bet = await Bet.findOne({
      msg_id: interaction.options.getString("message_id"),
    });
    if (!bet)
      return await interaction.reply({
        embeds: [new ErrorEmbed("I couldn't find the bet you're looking for.")],
        ephemeral: true,
      });
    if (bet.finished)
      return await interaction.reply({
        embeds: [new ErrorEmbed("This bet is already finished!")],
        ephemeral: true,
      });

    const actionRow = new ActionRowBuilder();
    for (const choice of bet.choiceArray) {
      actionRow.addComponents(
        new ButtonBuilder({
          customId: `endbet-${bet._id}-${choice}`,
          label: choice,
          style: ButtonStyle.Primary,
        })
      );
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder({
          title: `${bet.game} Bet`,
          description: "Please select the winning bet.",
        }),
      ],
      components: [actionRow],
      ephemeral: true,
    });
  },
};
