const { ErrorEmbed } = require("../../utils/embeds");
const General = require("../../models/Games/General");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (interaction.customId?.slice(0, 10) != "GeneralBuy") return;

    const [, uid, p, unit] = interaction.customId.split("-");
    const game = interaction.client.games.general[uid];
    if (!game)
      return await interaction.update({
        embeds: [new ErrorEmbed("This game has been cancelled.")],
        components: [],
      });

    const player = game[p];

    player.units[unit]++;
    player.points -= General.units[unit].price;

    game.rebuildActionRow(p);
    interaction.update({
      embeds: [game.rebuildEmbed(p)],
      components: [player.actionRow],
    });

    if (player.points == 0) game.unitPrompt(p);
  },
};
