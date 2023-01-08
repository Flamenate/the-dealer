const { SlashCommandBuilder } = require("discord.js");
const Gambler = require("../../models/Systems/Gambler");
const { GamblerEmbed } = require("../../utils/embeds");
const { ensurePlayable } = require("../../utils/ensure");
const { randChoice } = require("../../utils/random");
const sleep = require("util").promisify(setTimeout);

const data = new SlashCommandBuilder()
  .setName("slots")
  .setDescription("Play the Slot Machine")
  .addNumberOption((opt) =>
    opt
      .setName("bet")
      .setDescription("The amount of money you want to bet.")
      .setRequired(true)
      .setMaxValue(1000)
      .setMinValue(50)
  );

const emotes = ["🍒", "🍑", "🍇", "🍉", "🥝", "🍍"];
const colors = [0x206694, 0xf1c40f, 0xe67e22];

const delay = 1000;

module.exports = {
  data: data,
  async execute(interaction) {
    const bet = interaction.options.getNumber("bet");
    const gambler = await ensurePlayable(interaction);
    if (!gambler) return;

    const rows = [Array(3).fill(""), Array(3).fill(""), Array(3).fill("")];
    const base = `Your bet: **$${bet.toLocaleString()}**\n\n`;

    const embed = new GamblerEmbed(interaction.user, {
      color: 0xf1c40f,
      title: "🎰 Slot Machine",
      description:
        base + "❔ | ❔ | ❔\n▼ ▼ ▼ ▼ ▼\n❓ | ❓ | ❓\n▲ ▲ ▲ ▲ ▲\n❔ | ❔ | ❔",
      footer: { text: "Bet: Cringe" },
    });
    await interaction.reply({ embeds: [embed] });

    for (let i = 0; i < 3; i++) {
      await sleep(delay);

      for (let j = 0; j < 3; j++)
        rows[j] = [randChoice(emotes), randChoice(emotes), randChoice(emotes)];

      embed.setColor(colors[i]);
      embed.setDescription(
        base +
          rows[0].join(" | ") +
          "\n▼ ▼ ▼ ▼ ▼\n" +
          rows[1].join(" | ") +
          "\n▲ ▲ ▲ ▲ ▲\n" +
          rows[2].join(" | ")
      );

      await interaction.editReply({ embeds: [embed] });
    }

    const middleRow = new Set(rows[1]);
    let content;
    switch (middleRow.size) {
      case 3:
        await Gambler.updateOne(
          { _id: gambler._id },
          {
            $inc: { balance: -bet },
            $set: { "last_played.slots": new Date() },
          }
        );
        content = `You lost **$${bet.toLocaleString()}**...`;
        break;
      case 2:
        await Gambler.updateOne(
          { _id: gambler._id },
          {
            $inc: { balance: bet },
            $set: { "last_played.slots": new Date() },
          }
        );
        content = `You earned **$${bet.toLocaleString()}**!`;
        break;
      case 1:
        await Gambler.updateOne(
          { _id: gambler._id },
          {
            $inc: { balance: bet * 2 },
            $set: { "last_played.slots": new Date() },
          }
        );
        content = `JACKPOT! You earned **$${bet.toLocaleString()}**!`;
        break;
    }

    await interaction.editReply({ content: content });
  },
};
