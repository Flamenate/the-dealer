const ESCards = require("../../models/Games/ESCards");
const { ErrorEmbed } = require("../../utils/embeds");
const { EmbedBuilder } = require("discord.js");
const urlFromEmote = require("../../utils/urlFromEmote");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (interaction.customId?.slice(0, 3) != "ESC") return;

    const [, uid, player, card] = interaction.customId.split("-");
    const game = interaction.client.games.esc[uid];
    if (!game)
      return await interaction.update({
        embeds: [new ErrorEmbed("This game has been cancelled")],
        components: [],
      });

    game[player].cards[card]--;
    game[player].played = card;
    interaction.update({
      embeds: [
        new EmbedBuilder({
          title: "ES Cards",
          description: `You're playing **${ESCards.emotes[card]} ${card}**.`,
          image: {
            url: urlFromEmote(ESCards.emotes[card]),
          },
          color: 0x3498db,
        }),
      ],
      components: [],
    });

    game.announce();
  },
};
