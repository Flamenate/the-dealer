const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { ErrorEmbed } = require("../../utils/embeds");

const data = new SlashCommandBuilder()
  .setName("endvote")
  .setDescription("End a vote.")
  .addStringOption((opt) =>
    opt
      .setName("id")
      .setDescription("ID of the vote you want to end")
      .setRequired(true)
  );

module.exports = {
  data: data,
  async execute(interaction) {
    const uid = interaction.options.getString("id");
    const vote = interaction.client.activeVotes[uid];
    if (!vote)
      return await interaction.reply({
        embeds: [new ErrorEmbed("I couldn't find the vote with that ID.")],
        ephemeral: true,
      });
    const sortedFields = Object.entries(vote.choices)
      .sort(([, a], [, b]) => b - a)
      .map(([id, votes]) => {
        const member = interaction.guild.members.cache.get(id);
        return {
          name: member.displayName,
          value: votes.toString(),
          inline: true,
        };
      });

    await vote.msg.edit({ components: [] });
    await interaction.reply({
      embeds: [
        new EmbedBuilder({
          title: "Vote Results",
          url: `https://discord.com/channels/${interaction.guild.id}/${vote.msg.channelId}/${vote.msg.id}`,
          fields: sortedFields,
          footer: { text: `${vote.voters.length} votes` },
          color: 0xfffff0,
        }),
      ],
    });
    delete interaction.client.activeVotes[uid];
  },
};
