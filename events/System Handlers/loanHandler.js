const Loan = require("../../models/Systems/Loan");
const { ErrorEmbed, GamblerEmbed } = require("../../utils/embeds");
const { ensureDocument } = require("../../utils/ensure");
const Gambler = require("../../models/Systems/Gambler");
const { Types } = require("mongoose");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (!interaction.isButton() || interaction.customId?.slice(0, 4) != "loan")
      return;
    const [, gamblerId, duration, preCalcAmount, postCalcAmount] =
      interaction.customId.split("-");
    const gambler = await ensureDocument(interaction);
    if (interaction.user.id != gambler.account_id) return;

    const existingLoan = await Loan.findById(gambler.loan_id);
    if (existingLoan?.remaining_amount)
      return await interaction.reply({
        embeds: [
          new ErrorEmbed(
            "The Yakuza is still waiting for you to repay the first loan."
          ),
        ],
        ephemeral: true,
      });

    const newLoan = await Loan.create({
      _id: new Types.ObjectId(),
      gambler: {
        _id: gamblerId,
        account_id: interaction.user.id,
      },
      initial_amount: postCalcAmount,
      remaining_amount: postCalcAmount,
      duration,
    });
    newLoan.scheduleRepayment(interaction.user);

    await Gambler.updateOne(
      { _id: gambler._id },
      {
        $inc: { balance: preCalcAmount },
        $set: { loan_id: newLoan._id },
      }
    );

    await interaction.message.edit({
      components: [],
      embeds: [
        new GamblerEmbed(interaction.user, {
          title: "Loan Accepted",
          description: `The Yakuza has accepted to loan you **$${parseInt(
            preCalcAmount
          ).toLocaleString()}**, and you shall repay it with a **${
            Loan.durationMinutesToInterest[duration] * 100
          }%** interest as **$${parseInt(postCalcAmount).toLocaleString()}**.`,
          color: 0x57f287,
        }),
      ],
    });
  },
};
