const { EmbedBuilder } = require("discord.js");
const { Schema, Types, model } = require("mongoose");

const BetSchema = new Schema({
  _id: Types.ObjectId,
  game: String,
  msg_id: { type: String, required: true },
  amount: { type: Number, required: true },
  choices: { type: {}, required: true }, //{choice: [gambler_ids]}
  winning_option: { type: String, required: true, default: "" },
  locked: { type: Boolean, required: true, default: false },
});

BetSchema.virtual("choiceArray").get(function () {
  return Object.keys(this.choices);
});

BetSchema.virtual("totalBetters").get(function () {
  return this.choiceArray.reduce(
    (accumulator, choice) => accumulator + this.choices[choice].length,
    0
  );
});

BetSchema.virtual("minorityPercent").get(function () {
  let min = 0;
  for (const choice in this.choices) {
    if (min > this.choices[choice].length) min = this.choices[choice].length;
  }
  return min / this.totalBetters;
});

BetSchema.virtual("pool").get(function () {
  return this.totalBetters * this.amount;
});

BetSchema.virtual("finished").get(function () {
  return this.winning_option != "";
});

BetSchema.methods.scheduleEdits = function (msg) {
  if (!msg) return;

  let msgToEdit = msg;
  let lastTotalBetters;
  const iid = setInterval(async () => {
    const bet = await Bet.findById(this._id);
    if (bet.finished) return clearInterval(iid);

    const currentTotalBetters = bet.totalBetters;
    if (currentTotalBetters == lastTotalBetters) return;

    lastTotalBetters = currentTotalBetters;
    const embed = new EmbedBuilder(msgToEdit.embeds[0]);
    embed.setDescription(
      `Place your bet by clicking on one of the buttons below:\n\n- ${bet.choiceArray
        .map((choice) => `${choice} (**${bet.choices[choice].length}** bets)`)
        .join("\n- ")}`
    );

    msgToEdit = await msgToEdit.edit({ embeds: [embed] });
  }, 1000 * 5);
};

const Bet = model("ecbu-bets", BetSchema);

module.exports = Bet;
