const { EmbedBuilder } = require("discord.js");
const { ErrorEmbed } = require("../../utils/embeds");
const sleep = require("util").promisify(setTimeout);

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (
      !interaction.isButton() ||
      interaction.customId.slice(0, 8) != "treasure"
    )
      return;

    const [, uid, role, pos] = interaction.customId.split("-");
    const game = interaction.client.games.treasure[uid];
    if (!game)
      return await interaction.update({
        embeds: [new ErrorEmbed("This game has been cancelled.")],
        components: [],
      });

    game[role].position = pos;

    await interaction.update({
      embeds: [
        new EmbedBuilder({
          title: "Treasure Hoarder",
          description: `You ${
            role == "setter"
              ? "put your *Treasure Card* in "
              : "guessed the *Treasure Card* is in "
          } position ${parseInt(pos) + 1}.\nHead back to ${
            game.channel
          } to view round results.`,
          footer: {
            text: `Round ${game.round}`,
          },
          color: 0xfffff0,
        }),
      ],
      components: [],
    });

    game.announce();
  },
};
