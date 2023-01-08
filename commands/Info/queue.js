const {
  SlashCommandBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} = require("discord.js");
const Game = require("../../models/Systems/Game");
const { ensureDocument } = require("../../utils/ensure");

const data = new SlashCommandBuilder()
  .setName("queue")
  .setDescription("View game queues");

const emotes = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];

module.exports = {
  data: data,
  async execute(interaction) {
    const gambler = await ensureDocument(interaction);
    const menu = new StringSelectMenuBuilder({
      customId: "queueMenu",
      placeholder: gambler.queued_for
        ? `You're in queue for ${gambler.queued_for}.`
        : "Select a game to enter its queue...",
      disabled:
        interaction.client.queueLock ||
        Boolean(gambler.queued_for) ||
        Boolean(gambler.current_game),
    });

    const games = await Game.find({ active: true });

    const queueEmbed = new EmbedBuilder({
      title: "Game Queues",
      description: "Select a game from the dropdown menu to join its queue.",
      color: 0x206694,
      footer: {
        text: gambler.queued_for
          ? `You're in queue for ${gambler.queued_for}.`
          : "You're not in queue for any game.",
      },
    });
    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      queueEmbed.addFields({
        name: `${emotes[i]} ${game._id}`,
        value: `Required Players: **${game.required_players}** \nIn Queue: **${
          game.queue.length
        } player${game.queue.length == 1 ? "" : "s"}**\nAverage Duration: **${
          game.avg_time
        }m**`,
        inline: true,
      });
      menu.addOptions({
        label: game._id,
        value: game._id,
        description: `${game.queue.length} waiting`,
        emoji: emotes[i],
      });
    }
    await interaction.reply({
      content: gambler.queued_for
        ? `You're in queue for **${gambler.queued_for}**.`
        : "You're not in queue for any game.",
      embeds: [queueEmbed],
      components: [new ActionRowBuilder({ components: [menu] })],
      ephemeral: true,
    });
  },
};
