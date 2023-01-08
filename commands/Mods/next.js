const { SlashCommandBuilder } = require("discord.js");
const { ensureGame } = require("../../utils/ensure");
const Gambler = require("../../models/Systems/Gambler");
const Game = require("../../models/Systems/Game");
const { ErrorEmbed } = require("../../utils/embeds");

const data = new SlashCommandBuilder()
  .setName("next")
  .setDescription("Brings in the next people in queue.");

module.exports = {
  data: data,
  async execute(interaction) {
    const game = await ensureGame(interaction);
    if (!game) return;

    await interaction.deferReply();

    const vcPerms = [
      {
        id: interaction.guild.roles.everyone.id,
        allow: ["VIEW_CHANNEL"],
        deny: ["CONNECT"],
      },
      { id: game.hosting_data.host_id, allow: ["CONNECT"] },
    ];
    const textPerms = [
      {
        id: interaction.guild.roles.everyone.id,
        deny: ["VIEW_CHANNEL"],
      },
      { id: game.hosting_data.host_id, allow: ["VIEW_CHANNEL"] },
    ];
    const vc = await interaction.guild.channels.fetch(game.hosting_data.vc_id);

    await Gambler.updateMany(
      { _id: { $in: game.currently_playing } },
      { $set: { current_game: "" } }
    );
    await Game.updateOne(
      { _id: game._id },
      { $set: { currently_playing: [] } }
    );

    if (game.queue.length < game.required_players) {
      try {
        await vc.permissionOverwrites.set(vcPerms);
        await interaction.channel.permissionOverwrites.set(textPerms);
      } catch (error) {
        interaction.client.logger.commandLogger(2, interaction, error);
        await interaction.channel.send({
          embeds: [
            new ErrorEmbed(
              `Couldn't edit channel permissions.\nText Perms:\n${textPerms}\n-\nVoice Perms:\n${vcPerms}`
            ),
          ],
        });
      }
      return await interaction.editReply({
        embeds: [
          new EmbedBuilder({
            title: game._id,
            description: "There are not enough players in queue right now.",
            color: 0xf1c40f,
          }),
        ],
      });
    }

    game.currently_playing = [game.queue.shift()];
    let j = 0;
    while (j++ != game.required_players - 1) {
      const index = Math.floor(Math.random() * game.queue.length);
      game.currently_playing.push(game.queue[index]);
      game.queue.splice(index, 1);
    }

    await Gambler.updateMany(
      { _id: { $in: game.currently_playing } },
      { $set: { current_game: game._id, queued_for: "" } }
    );

    const mentions = [];
    for (let i = 0; i < game.currently_playing.length; i++) {
      const oid = game.currently_playing[i];
      const gambler = await Gambler.findById(oid);

      mentions.push(`<@${gambler.account_id}>`);

      vcPerms.push({ id: gambler.account_id, allow: ["CONNECT"] });
      textPerms.push({ id: gambler.account_id, allow: ["VIEW_CHANNEL"] });
    }

    try {
      await vc.permissionOverwrites.set(vcPerms);
      await interaction.channel.permissionOverwrites.set(textPerms);
    } catch (error) {
      interaction.client.logger.commandLogger(2, interaction, error);
      await interaction.channel.send({
        embeds: [
          new ErrorEmbed(
            `Couldn't edit channel permissions.\nText Perms:\n${textPerms}\n-\nVoice Perms:\n${vcPerms}`
          ),
        ],
      });
    }

    await interaction.editReply({
      content: mentions.join(" "),
      embeds: [
        {
          title: "Queue",
          description: `${mentions.join(" ")} it's your turn to play **${
            game._id
          }**!\nPlease join the host in <#${vc.id}>.`,
          color: 0x9b59b6,
        },
      ],
      allowedMentions: { parse: ["users"] },
    });

    await Game.updateOne(
      { _id: game._id },
      {
        $set: {
          currently_playing: game.currently_playing,
          queue: game.queue,
        },
      }
    );
  },
};
