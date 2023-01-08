const { ErrorEmbed } = require("../../utils/embeds");
const Gambler = require("../../models/Systems/Gambler");
const Bet = require("../../models/Systems/Bet");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (interaction.customId?.slice(0, 6) != "endbet") return;
    const [, betId, winningChoice] = interaction.customId.split("-");
    const bet = await Bet.findById(betId);
    if (!bet)
      return await interaction.reply({
        embeds: [new ErrorEmbed("This bet no longer exists.")],
        ephemeral: true,
      });
    if (bet.finished)
      return await interaction.reply({
        embeds: [new ErrorEmbed("This bet is finished.")],
        ephemeral: true,
      });

    await interaction.deferReply({ ephemeral: true });

    const pool = bet.pool;
    const winnings = pool * (1 - bet.minorityPercent);
    const winPerGambler = Math.floor(
      winnings / bet.choices[winningChoice].length
    );
    await Gambler.updateMany(
      {
        _id: { $in: bet.choices[winningChoice] },
      },
      { $inc: { balance: winPerGambler } }
    );
    await Bet.updateOne(
      { _id: bet._id },
      { $set: { winning_option: winningChoice } }
    );

    const msg = await interaction.channel.messages.fetch(bet.msg_id);
    const embed = new EmbedBuilder(msg.embeds[0]);
    let description = "The bet is over. Here are the results:\n";
    for (const choice in bet.choices) {
      if (choice == winningChoice)
        description += `\n-**${choice} (${
          bet.choices[choice].length
        } bets): $${(
          bet.choices[choice].length * bet.amount
        ).toLocaleString()}**`;
      else
        description += `\n-${choice} (${bet.choices[choice].length} bets): $${(
          bet.choices[choice].length * bet.amount
        ).toLocaleString()}`;
    }
    embed.setDescription(description);
    embed.setFooter({
      text: `Profit per player: $${(
        Math.floor(pool / bet.choices[winningChoice].length) - bet.amount
      ).toLocaleString()}`,
    });
    await msg.edit({ components: [], embeds: [embed] });

    await interaction.editReply("Done.");
  },
};
