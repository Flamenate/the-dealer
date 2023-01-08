const {
  SlashCommandBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
const Gambler = require("../../models/Systems/Gambler");
const { GamblerEmbed } = require("../../utils/embeds");
const { ensurePlayable } = require("../../utils/ensure");
const { randChoice, randNumberInclusive } = require("../../utils/random");
const sleep = require("util").promisify(setTimeout);

const data = new SlashCommandBuilder()
  .setName("roulette")
  .setDescription("Play a game of Russian Roulette")
  .addNumberOption((opt) =>
    opt
      .setName("bet")
      .setDescription("The bet you want to place")
      .setRequired(true)
      .setMaxValue(1000)
      .setMinValue(50)
  );

const gunEmotes = [
  "<:revolver:978230345105301595>",
  "<:revolver_alt:978230984464011334>",
];
const chamberRotatingEmote = "<a:chamber_rotating:978601508549582858>";
const chamberStillEmote = "<:chamber_still:978601589898108968>";
const sweatEmote = "<:sweat:978248800680427570>";

const earningBaseMultiplier = 0.15;

const pullButton = new ButtonBuilder({
  customId: "pullTrigger",
  label: "Pull the Trigger",
  style: ButtonStyle.Danger,
});
const cashoutButton = new ButtonBuilder({
  customId: "cashout",
  label: "Cash Out",
  style: ButtonStyle.Secondary,
});

const delay = 500;

module.exports = {
  data: data,
  async execute(interaction) {
    const bet = interaction.options.getNumber("bet");
    const gambler = await ensurePlayable(interaction, bet);
    if (!gambler) return;

    const gun = randChoice(gunEmotes);

    const embed = new GamblerEmbed(interaction.user, {
      title: gun + " Russian Roulette",
      description: `${chamberRotatingEmote} Rolling the chamber...`,
      color: 0xf1c40f,
    });
    await interaction.reply({ embeds: [embed] });

    await sleep(delay);

    const chamber = new Array(6).fill("empty");
    let bulletIndex = randNumberInclusive(0, 5);
    chamber[bulletIndex] = "bullet";

    const readyDesc = `${chamberStillEmote} The chamber is ready!\nYou may gamble your earnings, or cash out.`;
    embed.setDescription(readyDesc);
    embed.setFooter({ text: `Potential Earnings: $0` });

    const msg = await interaction.editReply({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(pullButton, cashoutButton),
      ],
      fetchReply: true,
    });

    const filter = (i) => i.user.id == interaction.user.id;
    const collector = msg.createMessageComponentCollector({
      filter,
      idle: 1000 * 20,
    });

    let earnings = bet;
    let round = 1;
    let lost = false;
    collector.on("collect", async (i) => {
      if (i.customId == "cashout") return collector.stop();

      await i.deferUpdate();

      embed.setDescription(gun + " Pulling the trigger...");
      embed.setColor(0x206694);
      await interaction.editReply({ embeds: [embed] });

      await sleep(delay);

      const result = chamber.pop();
      if (result == "bullet") {
        lost = true;
        return collector.stop();
      }

      earnings += Math.floor(earnings * round * earningBaseMultiplier);
      round++;

      embed.setDescription(readyDesc);
      embed.setColor(0xf1c40f);
      embed.setFooter({
        text: `Potential Earnings: $${earnings.toLocaleString()}`,
      });

      await i.message.edit({
        content: `${sweatEmote} Phew! You survived that one.`,
        embeds: [embed],
      });
    });

    let content = "";
    collector.on("end", async (_) => {
      if (lost) {
        await Gambler.updateOne(
          { _id: gambler._id },
          {
            $inc: { balance: -bet },
            $set: { "last_played.roulette": new Date() },
          }
        );
        content = `You lost **$${bet.toLocaleString()}**...`;
        embed.setDescription(
          "💥 BANG! The bullet went right through your head, you lost all your earnings 💀"
        );
        embed.setFooter({
          text: `Potential Earnings: $${earnings.toLocaleString()}`,
        });
        embed.setColor("RED");
        return;
      }

      if (round == 1) earnings = 0;

      await Gambler.updateOne(
        { _id: gambler._id },
        {
          $inc: { balance: earnings },
          $set: { "last_played.roulette": new Date() },
        }
      );

      content = `You won **$${earnings.toLocaleString()}**!`;

      const x = chamber.length - bulletIndex;
      embed.setDescription(
        `You decided to play it safe and cashed out your earnings of **$${earnings.toLocaleString()}**.\nIf you pulled the trigger **${x} more time${
          x > 1 ? "s" : ""
        }**, you would have died.`
      );
      embed.setFooter({
        text: `Earnings: $${earnings.toLocaleString()}`,
      });
      embed.setColor(0x57f287);

      await interaction.editReply({
        content: content,
        embeds: [embed],
        components: [],
      });
    });
  },
};
