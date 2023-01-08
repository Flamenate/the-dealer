const { Types } = require("mongoose");
const Gambler = require("../models/Systems/Gambler");
const { ErrorEmbed } = require("./embeds");
const moment = require("moment");
const Game = require("../models/Systems/Game");

const ensureGame = async (interaction) => {
  const game = await Game.findOne({
    "hosting_data.txt_id": interaction.channel.id,
  });
  if (!game)
    return await interaction.reply({
      embeds: [
        new ErrorEmbed(
          "This channel doesn't correspond to a game.\nIf you believe this is an error, please mention <@255792586403479562>."
        ),
      ],
      ephemeral: true,
      fetchReply: false,
    });
  return game;
};

const ensureDocument = async (interaction) => {
  const gambler = await Gambler.findByDiscordId(interaction.user.id);
  if (!gambler) {
    return await Gambler.create({
      _id: new Types.ObjectId(),
      account_id: interaction.user.id,
      username: interaction.user.tag,
    });
  }
  return gambler;
};

const forceDocument = async (user) => {
  const gambler = await Gambler.findByDiscordId(user.id);
  if (!gambler) {
    return await Gambler.create({
      _id: new Types.ObjectId(),
      account_id: user.id,
      username: user.tag,
    });
  }
  return gambler;
};

const ensurePlayable = async (interaction, bet) => {
  const gambler = await ensureDocument(interaction);
  if (bet > gambler.balance)
    return await interaction.reply({
      embeds: [new ErrorEmbed("You can't afford that bet.")],
      ephemeral: true,
      fetchReply: false,
    });

  const cdEndDate = moment(gambler.last_played[interaction.commandName]).add(
    5,
    "minutes"
  );
  if (cdEndDate.isAfter())
    return await interaction.reply({
      embeds: [
        new ErrorEmbed(
          `This game is still in cooldown!\nYou will be able to play it **<t:${cdEndDate.unix()}:R>**.`
        ),
      ],
      ephemeral: true,
      fetchReply: false,
    });

  return gambler;
};

const checkDMs = async (...users) => {
  for (const user of users) {
    try {
      await user.send(" ");
    } catch (error) {
      if (error.message == "Cannot send messages to this user")
        return { success: false, player: user };
    }
  }
  return { success: true, player: null };
};

module.exports = {
  ensureDocument,
  forceDocument,
  ensureGame,
  ensurePlayable,
  checkDMs,
};
