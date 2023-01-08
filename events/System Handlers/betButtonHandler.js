const { EmbedBuilder } = require("discord.js");
const { ErrorEmbed } = require("../../utils/embeds");
const { ensureDocument } = require("../../utils/ensure");
const Bet = require("../../models/Systems/Bet");
const Gambler = require("../../models/Systems/Gambler");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (!interaction.isButton() || interaction.customId?.slice(0, 3) != "bet")
      return;
    const [, betId, choice] = interaction.customId.split("-");
    const bet = await Bet.findById(betId);
    if (!bet)
      return await interaction.reply({
        embeds: [new ErrorEmbed("This bet no longer exists.")],
        ephemeral: true,
      });
    if (bet.finished || bet.locked)
      return await interaction.reply({
        embeds: [new ErrorEmbed("This bet is locked.")],
        ephemeral: true,
      });

    const gambler = await ensureDocument(interaction);
    if (bet.amount > gambler.balance)
      return await interaction.reply({
        embeds: [new ErrorEmbed("You can't afford to bet on this.")],
        ephemeral: true,
      });

    const existingBet = gambler.getBet(betId);
    if (existingBet)
      return await interaction.reply({
        embeds: [
          new ErrorEmbed(
            `You can't change your bet (Current bet: **${existingBet}**).`
          ),
        ],
        ephemeral: true,
      });

    bet.choices[choice].push(gambler._id.toString());
    await Bet.updateOne(
      { _id: bet._id },
      { $push: { [`choices.${choice}`]: gambler._id } }
    );

    gambler.balance -= bet.amount;
    gambler.bets[bet._id.toString()] = choice;
    await Gambler.updateOne(
      { _id: gambler._id },
      { $set: { bets: gambler.bets, balance: gambler.balance } }
    );

    await interaction.reply({
      embeds: [
        new EmbedBuilder({
          title: `${bet.game} Bet`,
          description: `Your **$${bet.amount.toLocaleString()}** bet on "**${choice}**" was registered.`,
        }),
      ],
      ephemeral: true,
    });
  },
};
