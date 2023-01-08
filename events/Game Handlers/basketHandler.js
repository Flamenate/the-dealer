const { ErrorEmbed } = require("../../utils/embeds");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (interaction.customId?.slice(0, 6) != "Basket") return;
    const [, uid, role, action] = interaction.customId.split("-");
    const game = interaction.client.games.basket[uid];
    if (!game)
      return await interaction.update({
        embeds: [new ErrorEmbed("This game has been cancelled.")],
        components: [],
      });

    if (game.disabledActions.includes(action))
      return await interaction.reply({
        embeds: [new ErrorEmbed("You can't use that right now!")],
        ephemeral: true,
      });

    game[role].action = action;

    interaction.update({
      embeds: [
        new EmbedBuilder({
          author: { name: "TEIA no Basket" },
          title: "Waiting for opponent...",
          description: `You chose **${action}**.\nHead back to ${game.channel} to view round results.`,
          color: 0xf1c40f,
        }),
      ],
      components: [],
    });

    game.play();
  },
};
