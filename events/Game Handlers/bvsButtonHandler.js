const {
  ModalBuilder,
  ActionRowBuilder,
  TextInputStyle,
  TextInputBuilder,
  EmbedBuilder,
} = require("discord.js");
const { ErrorEmbed } = require("../../utils/embeds");

const modal = new ModalBuilder({
  title: "Boss v Salaryman",
  components: [
    new ActionRowBuilder({
      components: [
        new TextInputBuilder({
          customId: "percentage",
          label: "Percentage",
          style: TextInputStyle.Short,
        }),
      ],
    }),
  ],
});

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (interaction.customId?.slice(0, 3) != "BVS") return;
    const [, uid, role, decision] = interaction.customId.split("-");
    const game = interaction.client.games.bvs[uid];
    if (!game)
      return await interaction.update({
        embeds: [new ErrorEmbed("This game has been cancelled.")],
        components: [],
      });

    if (role == "boss")
      return interaction.showModal(modal.setCustomId(`bvsModal-${uid}`));

    const salaryman = game[role];
    salaryman.decision = decision;
    const embed = new EmbedBuilder(interaction.message.embeds[0]);

    embed.setDescription(
      `You decided to **${decision}** your boss.\nHead back to ${game.channel} to view round results.`
    );

    interaction.update({
      embeds: [embed],
      components: [],
    });

    if (game.boss.offer) return game.announce();
  },
};
