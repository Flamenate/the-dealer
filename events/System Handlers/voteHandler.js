const { EmbedBuilder } = require("discord.js");
const { ErrorEmbed } = require("../../utils/embeds");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (!interaction.isButton() || interaction.customId?.slice(0, 4) != "vote")
      return;

    const [, uid, targetId] = interaction.customId.split("-");
    const vote = interaction.client.activeVotes[uid];
    if (!vote)
      return await interaction.update({
        components: [],
      });

    if (vote.voters.includes(interaction.user.id))
      return await interaction.reply({
        embeds: [new ErrorEmbed("You can't change your vote.")],
        ephemeral: true,
      });

    if (interaction.user.id == targetId)
      return await interaction.reply({
        embeds: [new ErrorEmbed("You can't vote against yourself.")],
        ephemeral: true,
      });

    vote.voters.push(interaction.user.id);
    vote.choices[targetId] += interaction.user.id == vote.doubleVoterId ? 2 : 1;

    const embed = new EmbedBuilder(vote.msg.embeds[0]);
    embed.setDescription(
      embed.data.description +
        `\n-${interaction.user} voted against <@${targetId}>.`
    );
    vote.msg.edit({
      embeds: [embed],
    });
    await interaction.reply({
      embeds: [
        new EmbedBuilder({
          description: `You voted against <@${targetId}>.`,
          color: 0x57f287,
        }),
      ],
      ephemeral: true,
    });
  },
};
