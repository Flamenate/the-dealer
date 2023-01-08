const { ensureGame, forceDocument } = require("../../utils/ensure");
const parseUserMentions = require("../../utils/parseUserMentions");
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const Gambler = require("../../models/Systems/Gambler");
const Game = require("../../models/Systems/Game");

const data = new SlashCommandBuilder()
  .setName("declare")
  .setDescription("Declare the outcome of a game")
  .addStringOption((opt) =>
    opt
      .setName("winners")
      .setDescription("The players who won the game")
      .setRequired(true)
  )
  .addStringOption((opt) =>
    opt
      .setName("losers")
      .setDescription("The players who lost the game")
      .setRequired(true)
  )
  .addIntegerOption((opt) =>
    opt
      .setName("bet")
      .setDescription("The bet that was agreed on")
      .setRequired(true)
      .setMinValue(0)
  )
  .addBooleanOption((opt) =>
    opt.setName("draw").setDescription("Was the game a draw?")
  );

module.exports = {
  data: data,
  async execute(interaction) {
    const game = await ensureGame(interaction);
    if (!game) return;

    await interaction.deferReply();

    const winners = parseUserMentions(interaction.options.getString("winners"));
    const losers = parseUserMentions(interaction.options.getString("losers"));
    const isDraw = interaction.options.getBoolean("draw");
    const bet = isDraw ? 0 : interaction.options.getInteger("bet");

    for (let i = 0; i < winners.ids.length; i++) {
      if (winners.ids[i]) {
        const winningMember = await interaction.guild.members.fetch(
          winners.ids[i]
        );
        const winningGambler = await forceDocument(winningMember.user);
        let gain = 0;
        if (!winningGambler.stats.history.includes(game._id))
          gain += Game.firstTimeBonus;

        await Gambler.updateOne(
          { _id: winningGambler._id },
          {
            $inc: {
              balance: bet + gain,
              "stats.games_played": 1,
              [`stats.game_wins.${game._id}`]: isDraw ? 0 : 1,
              "stats.gambling_profit": gain,
            },
            $addToSet: { "stats.history": game._id },
          }
        );
      }

      if (losers.ids[i]) {
        const losingMember = await interaction.guild.members.fetch(
          losers.ids[i]
        );
        const losingGambler = await forceDocument(losingMember.user);
        let loss = bet;
        if (!losingGambler.stats.history.includes(game._id))
          loss -= Game.firstTimeBonus;

        await Gambler.updateOne(
          { _id: losingGambler._id },
          {
            $inc: {
              balance: -loss,
              "stats.games_played": 1,
              "stats.gambling_loss": loss,
            },
            $addToSet: { "stats.history": game._id },
          }
        );
      }
    }
    const embed = new EmbedBuilder({
      title: game._id,
      color: 0x57f287,
      description: isDraw
        ? `It was a close draw between ${winners.mentions.join(
            ", "
          )} and ${losers.mentions.join(", ")}.`
        : "GGs!",
      fields: isDraw
        ? []
        : [
            {
              name: "Winners",
              value: `${winners.mentions.join(" ")}`,
            },
            {
              name: "Losers",
              value: `${losers.mentions.join(" ")}`,
            },
          ],
      timestamp: new Date(),
      footer: { text: `Bet: $${bet.toLocaleString()}` },
    });
    await interaction.editReply({ embeds: [embed] });
  },
};
