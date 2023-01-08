const { EmbedBuilder } = require("discord.js");
const { ErrorEmbed } = require("../../utils/embeds");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (interaction.customId?.slice(0, 9) != "pokeModal") return;
    const uid = interaction.customId.split("-")[1];
    const game = interaction.client.games.poke[uid];
    if (!game)
      return await interaction.update({
        embeds: [new ErrorEmbed("This game has been cancelled.")],
        components: [],
      });

    const player = game.players[interaction.user.id];

    const guess = interaction.fields.getTextInputValue("guess");
    if (!guess.match(/^\d$/) || parseInt(guess) > 6)
      return await interaction.reply({
        embeds: [new ErrorEmbed("Please input a digit between 0 and 6.")],
        ephemeral: true,
      });

    player.guess = parseInt(guess);
    interaction.update({
      embeds: [
        new EmbedBuilder({
          description: `Please head over to ${game.channel} to view round results.`,
          fields: [
            {
              name: "Deployed Pokéballs",
              value: player.deployed.toString(),
              inline: true,
            },
            { name: "Your Guess", value: guess, inline: true },
          ],
        }),
      ],
      components: [],
    });

    game.announce();
  },
};
