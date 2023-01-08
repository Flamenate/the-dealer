const {
  SlashCommandBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonStyle,
} = require("discord.js");
const Spy = require("../../models/Games/Spy");
const { ErrorEmbed } = require("../../utils/embeds");
const { checkDMs } = require("../../utils/ensure");
const { generateUID } = require("../../utils/random");

const data = new SlashCommandBuilder()
  .setName("spy")
  .setDescription("Spy x Family")
  .addUserOption((opt) =>
    opt.setName("spy").setDescription("Spy").setRequired(true)
  )
  .addUserOption((opt) =>
    opt.setName("player2").setDescription("Player 2").setRequired(true)
  )
  .addUserOption((opt) => opt.setName("player3").setDescription("Player 3"))
  .addUserOption((opt) => opt.setName("player4").setDescription("Player 4"))
  .addUserOption((opt) => opt.setName("player5").setDescription("Player 5"));

module.exports = {
  data: data,
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const players = [
      interaction.options.getMember("spy"),
      interaction.options.getMember("player2"),
      interaction.options.getMember("player3"),
      interaction.options.getMember("player4"),
      interaction.options.getMember("player5"),
    ].filter((e) => e);
    const { success, player } = await checkDMs(...players);
    if (!success)
      return await interaction.editReply({
        embeds: [
          new ErrorEmbed(
            `The game can't be played because ${player}'s DMs are closed.`
          ),
        ],
      });

    const uid = generateUID();
    const buttons = [];
    players.forEach((p) =>
      buttons.push(
        new ButtonBuilder({
          customId: `spy-${uid}-${p.id}`,
          label: p.displayName,
          style: ButtonStyle.Danger,
        })
      )
    );

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const actionRow = new ActionRowBuilder({ components: buttons });

      await player.send({
        embeds: [
          new EmbedBuilder({
            title: i == 0 ? "⚠️ YOU ARE THE SPY!" : "You are NOT the spy",
            description: "Vote against the player you think is the spy.",
            color: 0x57f287,
            footer: {
              text: i == 0 ? "⚠️ You are the spy!" : "You are not the spy.",
            },
          }),
        ],
        components: [actionRow],
      });
    }

    interaction.client.games.spy[uid] = new Spy(
      uid,
      interaction.channel,
      players[0].id,
      players.map((p) => p.id)
    );
    await interaction.editReply({
      embeds: [
        new EmbedBuilder({
          description:
            "Vote messages were sent, results will be sent in this channel.",
        }),
      ],
    });
  },
};
