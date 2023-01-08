const { SlashCommandBuilder } = require("discord.js");
const Loan = require("../../models/Systems/Loan");
const { forceDocument } = require("../../utils/ensure");
const moment = require("moment");
const { GamblerEmbed } = require("../../utils/embeds");

const data = new SlashCommandBuilder()
  .setName("profile")
  .setDescription("View your profile")
  .addUserOption((opt) =>
    opt.setName("user").setDescription("User whose profile you want to check")
  );

module.exports = {
  data: data,
  async execute(interaction) {
    const user = interaction.options.getUser("user") || interaction.user;
    const gambler = await forceDocument(user);

    const loan = await Loan.findOne(gambler.loan_id);
    const loanData =
      loan?.remaining_amount > 0
        ? `${user}'s debt of **$${loan.remaining_amount.toLocaleString()}** will be repaid <t:${moment(
            loan._id.getTimestamp()
          )
            .add(loan.duration, "minutes")
            .unix()}:R>.`
        : `${user} does not have a debt with the Yakuza.`;

    const profileEmbed = new GamblerEmbed(user, {
      description: "Professional Gambler.",
      thumbnail: { url: user.displayAvatarURL() },
      fields: [
        {
          name: "Balance",
          value: `$${gambler.balance.toLocaleString()}`,
        },
        { name: "Loan", value: loanData },
        {
          name: "Game Wins",
          value: Object.values(gambler.stats.game_wins)
            .reduce((acc, curr) => acc + curr)
            .toString(),
        },
      ],
      color: 0x992d22,
    });

    await interaction.reply({ embeds: [profileEmbed] });
  },
};
