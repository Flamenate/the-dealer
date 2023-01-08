const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const data = new SlashCommandBuilder()
  .setName("leaderboard")
  .setDescription("Get leaderboard link");

module.exports = {
  data: data,
  async execute(interaction) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder({
          url: "https://teia.tn/casino?tab=leaderboard",
          title: "Leaderboard",
          color: 0xf1c40f,
          description:
            "To view the leaderboard, please visit:\nhttps://teia.tn/casino?tab=leaderboard",
        }),
      ],
    });
  },
};
