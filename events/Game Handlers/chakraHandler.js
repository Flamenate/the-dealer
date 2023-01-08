const { EmbedBuilder } = require("discord.js");
const Chakra = require("../../models/Games/Chakra");
const urlFromEmote = require("../../utils/urlFromEmote");
const { ErrorEmbed } = require("../../utils/embeds");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (interaction.customId?.slice(0, 6) != "Chakra") return;

    const [, uid, p, pickedCard] = interaction.customId.split("-");
    const game = interaction.client.games.chakra[uid];
    if (!game)
      return await interaction.update({
        embeds: [new ErrorEmbed("This game has been cancelled")],
        components: [],
      });

    const player = game[p];
    player.pickedCard = pickedCard;
    player.cards = player.cards.filter((card) => card != pickedCard);
    game.rebuildActionRow(p);

    interaction.update({
      embeds: [
        new EmbedBuilder({
          author: { name: "Chakra Elements" },
          title: "Card Selected",
          color: 0x1f8b4c,
          description: `You're playing the **${pickedCard}** card.\nHead over to ${game.channel} to view round results.`,
          image: {
            url: urlFromEmote(Chakra.cards[pickedCard].emote),
          },
        }),
      ],
      components: [],
    });
    game.announce();
  },
};
