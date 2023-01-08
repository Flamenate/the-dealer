const { EmbedBuilder } = require("discord.js");
const { ErrorEmbed } = require("../../utils/embeds");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (interaction.customId?.slice(0, 7) != "chinchi") return;

    const [, uid, action] = interaction.customId.split("-");
    const game = interaction.client.games.chinchi[uid];
    if (!game)
      return await interaction.update({
        embeds: [new ErrorEmbed("This game has been cancelled.")],
        components: [],
      });

    const player = game.players[interaction.user.id];

    if (action == "ready") {
      player.ready = true;
      const embed = new EmbedBuilder(interaction.message.embeds[0]);
      embed.setDescription(
        `Head over to ${game.channel} to view round results.`
      );
      interaction.update({
        embeds: [embed],
        components: [],
      });
      return game.announce();
    }

    player.rerolls--;
    const embed = game.rollDice(interaction.user.id);

    if (player.rerolls > 0)
      return await interaction.update({ embeds: [embed] });

    player.ready = true;
    interaction.update({
      embeds: [
        embed.setDescription(
          `Head over to ${game.channel} to view round results.`
        ),
      ],
      components: [],
    });
    return game.announce();
  },
};
