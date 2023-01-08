const {
  SlashCommandBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} = require("discord.js");
const Game = require("../../models/Systems/Game");
const { ensureDocument } = require("../../utils/ensure");

const data = new SlashCommandBuilder()
  .setName("games")
  .setDescription("View game descriptions");

module.exports = {
  data: data,
  async execute(interaction) {
    const menu = new StringSelectMenuBuilder({
      customId: "infoMenu",
      placeholder: "Select a game...",
    });

    const embed = new EmbedBuilder({
      url: "https://teia.tn/casino?tab=games",
      title: "Game Descriptions",
      description: `Select a game from the dropdown menu to read its description.\nGames with 🎁 give you a bonus of **$${Game.firstTimeBonus.toLocaleString()}** for playing them the first time (even if you lose!).`,
      color: 0xe91e63,
    });

    const gambler = await ensureDocument(interaction);

    for (const game of await Game.find({ active: true })) {
      menu.addOptions({
        label: game._id,
        value: game._id,
        description: `Required players: ${game.required_players}`,
        emoji: gambler.stats.history.includes(game._id) ? "☑️" : "🎁",
      });
    }
    await interaction.reply({
      embeds: [embed],
      components: [new ActionRowBuilder({ components: [menu] })],
      ephemeral: true,
    });
  },
};
