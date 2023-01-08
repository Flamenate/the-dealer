const { Schema, Types, model } = require("mongoose");

const GameSchema = new Schema({
  _id: String, //game name
  queue: {
    type: [Types.ObjectId],
    required: true,
    default: [],
  },
  currently_playing: {
    type: [Types.ObjectId],
    required: true,
    default: [],
  },
  required_players: {
    type: Number,
    required: true,
    default: 2,
  },
  active: { type: Boolean, required: true, default: true },
  description: { type: String, required: true, default: "" },
  img: { type: String, required: true, default: "" },
  avg_time: { type: Number, required: true, default: 5 },
  hosting_data: {
    type: { host_id: String, txt_id: String, vc_id: String },
    required: true,
    default: { host_id: "", txt_id: "", vc_id: "" },
  },
});

const Game = model("ecbu-games", GameSchema);
Game.firstTimeBonus = 500;

module.exports = Game;
