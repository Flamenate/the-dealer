const { EmbedBuilder } = require("discord.js");
const Orlog = require("../../models/Games/Orlog");
const { ErrorEmbed } = require("../../utils/embeds");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (interaction.customId?.slice(0, 5) != "Orlog") return;
    const [, uid, player] = interaction.customId.split("-");
    const game = interaction.client.games.orlog[uid];
    if (!game)
      return await interaction.update({
        embeds: [new ErrorEmbed("This game has been cancelled.")],
        components: [],
      });

    game[player].orderedDice = interaction.values.map((v) => v.slice(0, -1));
    interaction.update({
      embeds: [
        new EmbedBuilder({
          title: `Round ${game.round}`,
          description: `Your choices were registered in the following order:\n${interaction.values
            .map(
              (die, i) =>
                `**${i + 1}.** ${
                  Orlog.dice[die.slice(0, -1)].emoji
                } ${die.slice(0, -1)}`
            )
            .join("\n")}`,
          color: 0x57f287,
          footer: {
            text: "Please head over to the game channel to watch the fight.",
          },
        }),
      ],
      components: [],
    });
    game.fight();
  },
};
