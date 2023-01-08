const { EmbedBuilder } = require("discord.js");
const { ErrorEmbed } = require("../../utils/embeds");

const percentRegex = /^([0-9][0-9]?)%?$/g;

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (interaction.customId?.slice(0, 8) != "bvsModal") return;
    const game =
      interaction.client.games.bvs[interaction.customId.split("-")[1]];
    if (!game)
      return await interaction.update({
        embeds: [new ErrorEmbed("This game has been cancelled.")],
        components: [],
      });

    const match = [
      ...interaction.fields
        .getTextInputValue("percentage")
        .matchAll(percentRegex),
    ][0];
    if (!match || match[1] == 0)
      return await interaction.reply({
        embeds: [
          new ErrorEmbed("Please input a percentage between `1%` and `99%`."),
        ],
        ephemeral: true,
      });

    game.boss.offer = parseInt(match[1]);
    const embed = new EmbedBuilder(interaction.message.embeds[0]);
    embed.setDescription(
      `You set the percentage to \`${game.boss.offer}%\`.\nHead back to ${game.channel} to view round results.`
    );
    interaction.update({
      embeds: [embed],
      components: [],
    });

    if (game.salaryman.decision) game.announce();
  },
};
