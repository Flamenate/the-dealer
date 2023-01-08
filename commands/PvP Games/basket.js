const { SlashCommandBuilder } = require("discord.js");
const Basket = require("../../models/Games/Basket");
const { generateUID } = require("../../utils/random");

const data = new SlashCommandBuilder()
  .setName("basket")
  .setDescription("TEIA No Basket")
  .addUserOption((opt) =>
    opt
      .setName("player1")
      .setDescription("Mention the 1st player")
      .setRequired(true)
  )
  .addUserOption((opt) =>
    opt
      .setName("player2")
      .setDescription("Mention the 2nd player")
      .setRequired(true)
  );

module.exports = {
  data: data,
  async execute(interaction) {
    const p1 = interaction.options.getUser("player1");
    const p2 = interaction.options.getUser("player2");
    const uid = generateUID();

    const game = new Basket(uid, interaction.channel, p1, p2);
    interaction.client.games.basket[uid] = game;
    game.advance();

    await interaction.reply({
      content: "Game created.",
      ephemeral: true,
    });
  },
};
