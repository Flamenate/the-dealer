const { model, Schema, Types } = require("mongoose");
const { GamblerEmbed } = require("../../utils/embeds");
const Gambler = require("./Gambler");

const LoanSchema = new Schema({
  _id: Types.ObjectId,
  gambler: {
    _id: Types.ObjectId,
    account_id: String,
  },
  initial_amount: Number,
  remaining_amount: Number,
  duration: Number, //in minutes
});

LoanSchema.methods.repay = async function (user) {
  await Gambler.updateOne(
    { _id: this.gambler._id },
    { $inc: { balance: -this.remaining_amount } }
  );

  this.remaining_amount = 0;
  await this.save();

  try {
    await user.send({
      embeds: [
        new GamblerEmbed(user, {
          title: "Loan Repaid",
          description: `Your debt of **$${this.initial_amount.toLocaleString()}** was repaid.`,
          footer: { text: "The Yakuza is satisfied." },
          color: 0x99aab5,
        }),
      ],
    });
  } catch (e) {
    console.log(`Couldn't inform ${user.id} of their loan repayment`);
  }
};
LoanSchema.methods.scheduleRepayment = function (user) {
  setTimeout(() => this.repay(user), 1000 * 60 * this.duration);
};

const Loan = model("ecbu-loans", LoanSchema);

Loan.durationMinutesToInterest = {
  15: 0.2,
  30: 0.4,
  45: 0.6,
};

module.exports = Loan;
