const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
} = require("discord.js");
const Vote = require("../../models/Systems/Vote");
const { ErrorEmbed } = require("../../utils/embeds");
const { generateUID } = require("../../utils/random");
const parseUserMentions = require("../../utils/parseUserMentions");

const data = new SlashCommandBuilder()
  .setName("vote")
  .setDescription("Create a vote.")
  .addStringOption((opt) =>
    opt
      .setName("accused")
      .setDescription("Players accused (maximum 10)")
      .setRequired(true)
  )
  .addUserOption((opt) =>
    opt
      .setName("sacrifice")
      .setDescription("Player who has the 'Sacrifice' role")
  );

module.exports = {
  data: data,
  async execute(interaction) {
    const { _, ids } = parseUserMentions(
      interaction.options.getString("accused")
    );
    if (ids.length > 10)
      return await interaction.reply({
        embeds: [new ErrorEmbed("Please mention a maximum of 10 people.")],
        ephemeral: true,
      });
    await interaction.deferReply();

    const uid = generateUID();
    const actionRows =
      ids.length <= 5
        ? [new ActionRowBuilder()]
        : [new ActionRowBuilder(), new ActionRowBuilder()];
    for (let i = 0; i < ids.length; i++) {
      const memberId = ids[i];
      const member = await interaction.guild.members.fetch(memberId);

      const actionRow = actionRows[Math.floor(i / 5)];
      actionRow.addComponents(
        new ButtonBuilder({
          custom_id: `vote-${uid}-${memberId}`,
          style: ButtonStyle.Secondary,
          label: member.displayName,
        })
      );
    }
    const msg = await interaction.editReply({
      embeds: [
        new EmbedBuilder({
          title: "👨🏻‍⚖️ It's Voting Time!",
          description:
            "Vote on a player by clicking on the button with their name.\n\n**Votes:**",
          color: 0x34495e,
          footer: { text: `ID: ${uid}` },
          thumbnail: {
            url: "https://www.pcgamesn.com/wp-content/sites/pcgamesn/2019/04/phoenix-wright-ace-attorney-trilogy-remastered.jpg",
          },
        }),
      ],
      components: actionRows,
      fetchReply: true,
    });
    interaction.client.activeVotes[uid] = new Vote(
      uid,
      msg,
      ids,
      interaction.options.getUser("sacrifice")?.id
    );
  },
};
