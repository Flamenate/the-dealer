const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { ErrorEmbed } = require("../../utils/embeds");
const Bet = require("../../models/Systems/Bet");
const { Types } = require("mongoose");

const data = new SlashCommandBuilder()
  .setName("bet")
  .setDescription("Bet on a betting game")
  .addStringOption((opt) =>
    opt
      .setName("game")
      .setDescription("The game that gamblers will be betting on.")
      .setRequired(true)
  )
  .addNumberOption((opt) =>
    opt
      .setName("amount")
      .setDescription("The betting amount.")
      .setRequired(true)
  )
  .addStringOption((opt) =>
    opt
      .setName("choices")
      .setDescription("Options they can bet on (separated by commas)")
      .setRequired(true)
  );

module.exports = {
  data: data,
  async execute(interaction) {
    const rawChoices = interaction.options.getString("choices");
    const choices = {};
    rawChoices.split(",").forEach((c) => (choices[c.trim()] = []));
    const choiceArr = Object.keys(choices);
    if (choiceArr.length < 2)
      return await interaction.reply({
        embeds: [
          new ErrorEmbed(
            "Please specify at least 2 choices separated by a comma (,)"
          ),
        ],
      });

    const betData = {
      _id: new Types.ObjectId(),
      game: interaction.options.getString("game"),
      amount: interaction.options.getNumber("amount"),
      choices,
    };
    const actionRow = new ActionRowBuilder();
    for (const choice of choiceArr) {
      actionRow.addComponents(
        new ButtonBuilder({
          customId: `bet-${betData._id}-${choice}`,
          label: choice,
          style: ButtonStyle.Success,
        })
      );
    }
    const msg = await interaction.reply({
      embeds: [
        new EmbedBuilder({
          title: `${betData.game}`,
          description: `Place a bet by clicking on one of the buttons below:\n\n- ${choiceArr.join(
            "\n- "
          )}`,
          footer: {
            text: `Bet Value: $${betData.amount.toLocaleString()}`,
          },
          color: 0x5865f2,
        }),
      ],
      components: [actionRow],
      fetchReply: true,
    });
    const bet = await Bet.create({ ...betData, msg_id: msg.id });
    bet.scheduleEdits(msg);
  },
};
