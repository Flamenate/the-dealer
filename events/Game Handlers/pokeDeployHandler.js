const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { ErrorEmbed } = require("../../utils/embeds");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (interaction.customId?.slice(0, 4) != "Poke") return;

    const [, uid, deployed] = interaction.customId.split("-");
    const game = interaction.client.games.poke[uid];
    if (!game)
      return await interaction.update({
        embeds: [new ErrorEmbed("This game has been cancelled.")],
        components: [],
      });

    const player = game.players[interaction.user.id];
    player.deployed = parseInt(deployed);

    interaction.update({
      embeds: [
        new EmbedBuilder({
          author: { name: "3 Pokéballs" },
          title: "Guessing Time",
          description: "Guess how many __total__ pokéballs have been deployed.",
          color: 0xe67e22,
          fields: [
            {
              name: "Your Deployed Pokéballs",
              value: deployed,
              inline: true,
            },
            {
              name: "Pokéballs Left",
              value: player.pokeballs.toString(),
              inline: true,
            },
          ],
        }),
      ],
      components: [
        new ActionRowBuilder({
          components: [
            new ButtonBuilder({
              label: "Guess",
              customId: `pokeTriggerModal-${game.uid}`,
              style: ButtonStyle.Success,
            }),
          ],
        }),
      ],
    });
  },
};
