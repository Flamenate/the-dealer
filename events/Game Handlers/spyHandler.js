const { EmbedBuilder } = require("discord.js");
const { ErrorEmbed } = require("../../utils/embeds");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (!interaction.isButton() || interaction.customId?.slice(0, 3) != "spy")
      return;

    const [, uid, targetId] = interaction.customId.split("-");
    const game = interaction.client.games.spy[uid];
    if (!game)
      return await interaction.update({
        embeds: [new ErrorEmbed("This game has been cancelled.")],
        components: [],
      });

    if (targetId == game.spy.id) game.spy.votes++;
    await interaction.update({
      embeds: [
        new EmbedBuilder({
          title: "Spy x Family",
          description: `You voted against <@${targetId}>.`,
          color: 0x57f287,
        }),
      ],
      components: [],
    });

    game.players[interaction.user.id] = true;
    if (!Object.values(game.players).every((voted) => voted)) return;

    const clause =
      game.spy.votes != 1 ? `were ${game.spy.votes} votes` : "was 1 vote";

    await game.channel.send({
      embeds: [
        new EmbedBuilder({
          title: "Spy x Family",
          description: `There ${clause} against the spy.`,
          color: 0x992d22,
        }),
      ],
    });
    return delete interaction.client.games.spy[game.uid];
  },
};
