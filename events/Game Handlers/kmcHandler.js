const { EmbedBuilder } = require("discord.js");
const { ErrorEmbed } = require("../../utils/embeds");
const KMC = require("../../models/Games/KMC");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (interaction.customId?.slice(0, 3) != "KMC") return;
    const [, uid, role, coin] = interaction.customId.split("-");
    const game = interaction.client.games.kmc[uid];
    if (!game)
      return await interaction.update({
        embeds: [new ErrorEmbed("This game has been cancelled.")],
        components: [],
      });

    game[role].coin = coin;

    interaction.update({
      embeds: [
        new EmbedBuilder({
          author: { name: "Kumo no Canzone" },
          description: `You chose **${KMC.emotes[coin]} ${coin}**.\nHead back to ${game.channel} to view round results.`,
          color: 0x57f287,
        }),
      ],
      components: [],
    });

    game.announce();
  },
};
