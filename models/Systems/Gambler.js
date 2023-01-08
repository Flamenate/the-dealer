const { Schema, Types, model } = require("mongoose");

const GamblerSchema = new Schema({
  _id: Types.ObjectId,
  account_id: { type: String, required: true },
  username: { type: String, required: true },
  balance: { type: Number, required: true, default: 10000 },
  queued_for: { type: String, required: true, default: "" }, //game name
  current_game: { type: String, required: true, default: "" },
  bets: {
    type: Object, //{betId: choice}
    required: true,
    default: {},
  },
  loan_id: { type: Types.ObjectId },
  last_played: {
    //for PvE games
    type: { blackjack: Date, roulette: Date, slots: Date },
    required: true,
    default: {
      blackjack: new Date(),
      roulette: new Date(),
      slots: new Date(),
    },
  },
  stats: {
    type: {
      history: [],
      game_wins: {},
      games_played: Number,
      gambling_profit: Number,
      gambling_loss: Number,
      loan_money: Number,
      _id: false,
    },
    required: true,
    default: {
      history: [],
      game_wins: {},
      games_played: 0,
      gambling_profit: 0,
      gambling_loss: 0,
      loan_money: 0,
    },
  },
});

GamblerSchema.methods.getBet = function (bet_id) {
  if (this.bets.hasOwnProperty(bet_id)) return this.bets[bet_id];
  return null;
};

GamblerSchema.statics.findByDiscordId = async function (id) {
  return await this.findOne({ account_id: id });
};

const Gambler = model("ecbu-gamblers", GamblerSchema);

module.exports = Gambler;
