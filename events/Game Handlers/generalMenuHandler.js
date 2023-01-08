const General = require("../../models/Games/General");
const { ErrorEmbed, GamblerEmbed } = require("../../utils/embeds");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (interaction.customId?.slice(0, 13) != "GeneralSelect") return;

    const [, uid, p] = interaction.customId.split("-");
    const game = interaction.client.games.general[uid];
    if (!game)
      return await interaction.update({
        embeds: [new ErrorEmbed("This game has been cancelled.")],
        components: [],
      });

    const player = game[p];

    const unit = interaction.values[0];
    player.activeUnit.unit = unit;
    player.units[unit]--;
    interaction.update({
      embeds: [
        new GamblerEmbed(interaction.user, {
          description: `You selected **${General.units[unit].emote} ${unit}**.\nHead over to ${game.channel} to view round results.`,
          color: 0x5865f2,
        }),
      ],
      components: [],
    });

    game.fight();
  },
};
