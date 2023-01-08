const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const Loan = require("../../models/Systems/Loan");
const { ensureDocument } = require("../../utils/ensure");
const moment = require("moment");
const { GamblerEmbed, ErrorEmbed } = require("../../utils/embeds");

const data = new SlashCommandBuilder()
  .setName("loan")
  .setDescription("Take a loan from the Yakuza")
  .addIntegerOption((opt) =>
    opt
      .setName("amount")
      .setDescription("The amount you want to borrow")
      .setRequired(true)
      .setMinValue(100)
      .setMaxValue(5000)
  );

module.exports = {
  data: data,
  async execute(interaction) {
    const gambler = await ensureDocument(interaction);

    if (gambler.balance <= -4900) {
      return await interaction.reply({
        embeds: [
          new ErrorEmbed(
            "There's no point in taking a loan from the Yakuza, you won't be able to repay it anyway..."
          ),
        ],
      });
    }

    const loan = await Loan.findById(gambler.loan_id);
    if (loan?.remaining_amount)
      return await interaction.reply({
        embeds: [
          new GamblerEmbed(interaction.user, {
            title: "Yakuza Loan",
            description: `You already have a loan of **$${loan.initial_amount.toLocaleString()}** that will be repaid <t:${moment()
              .add(loan.duration, "minutes")
              .unix()}:R>.`,
            color: 0xf1c40f,
          }),
        ],
      });

    const amount = interaction.options.getInteger("amount");
    const loanEmbed = new EmbedBuilder({
      title: "Yakuza Loan",
      description:
        "Take a loan from the Yakuza to help feed your gambling addiction!\nChoose the loan duration, and make sure you can pay it in time, or else...",
      color: 0xfffff0,
      fields: [],
    });
    const actionRow = new ActionRowBuilder();
    for (const duration in Loan.durationMinutesToInterest) {
      const postCalcAmount = Math.floor(
        amount * (1 + Loan.durationMinutesToInterest[duration])
      );
      loanEmbed.addFields({
        name: `${duration} Minutes`,
        value: `Interest: **${
          Loan.durationMinutesToInterest[duration] * 100
        }%**\nRepayment: **$${postCalcAmount.toLocaleString()}**`,
        inline: true,
      });
      actionRow.addComponents(
        new ButtonBuilder({
          customId: `loan-${gambler._id}-${duration}-${amount}-${postCalcAmount}`,
          label: `${duration} Minutes ($${postCalcAmount.toLocaleString()})`,
          emoji: "🕒",
          style: ButtonStyle.Secondary,
        })
      );
    }

    await interaction.reply({
      embeds: [loanEmbed],
      components: [actionRow],
    });
  },
};
