const {
  ButtonBuilder,
  ActionRowBuilder,
  SlashCommandBuilder,
  ButtonStyle,
} = require("discord.js");
const Gambler = require("../../models/Systems/Gambler");
const { GamblerEmbed } = require("../../utils/embeds");
const { ensurePlayable } = require("../../utils/ensure");
const { randNumberInclusive } = require("../../utils/random");
const sleep = require("util").promisify(setTimeout);

const data = new SlashCommandBuilder()
  .setName("blackjack")
  .setDescription("Play a game of Blackjack against the bot.")
  .addNumberOption((opt) =>
    opt
      .setName("bet")
      .setDescription("The bet you want to place")
      .setRequired(true)
      .setMaxValue(1000)
      .setMinValue(50)
  );

const hitButton = new ButtonBuilder({
  customId: "hit",
  label: "Hit",
  style: ButtonStyle.Success,
});
const standButton = new ButtonBuilder({
  customId: "stand",
  label: "Stand",
  style: ButtonStyle.Danger,
});

const spadesEmote = "<:spades_white:978608245017018448>";
const cardEmotes = [
  "<:facedown:1000846617106202654>",
  "<:A_card:1000846614694465717>",
  "<:2_card:1000846595006419137>",
  "<:3_card:1000846597686562896>",
  "<:4_card:1000846600215732264>",
  "<:5_card:1000846602417746020>",
  "<:6_card:1000846604636524665>",
  "<:7_card:1000846607207645275>",
  "<:8_card:1000846609728405534>",
  "<:9_card:1000846612383408208>",
  "<:K_card:1000846619429851158>",
];
const delay = 1.25 * 1000;

async function lose(gambler, bet, embed) {
  await Gambler.updateOne(
    { _id: gambler._id },
    {
      $inc: { balance: -bet },
      $set: { "last_played.blackjack": new Date() },
    }
  );
  embed.setFooter({ text: "You lose." });
  return `You lost **$${bet.toLocaleString()}**...`;
}
async function win(gambler, bet, embed, bj) {
  let earnings = bet;
  let footerText = "You win!";
  let prefix = "";
  if (bj) {
    earnings *= 2;
    footerText = "BLACKJACK!";
    content = "BLACKJACK! ";
  }
  await Gambler.updateOne(
    { _id: gambler._id },
    {
      $inc: { balance: earnings },
      $set: { "last_played.blackjack": new Date() },
    }
  );
  embed.setFooter({ text: footerText });
  return prefix + `You earned **$${earnings.toLocaleString()}**!`;
}

module.exports = {
  data: data,
  async execute(interaction) {
    const bet = interaction.options.getNumber("bet");
    const gambler = await ensurePlayable(interaction, bet);
    if (!gambler) return;

    const embed = new GamblerEmbed(interaction.user, {
      title: spadesEmote + " Blackjack",
      description: `Your bet: **$${bet.toLocaleString()}**`,
      color: 0x00000a,
    });

    const dealerFirstCard = randNumberInclusive(5, 10);
    const playerFirstHand = [
      randNumberInclusive(1, 10),
      randNumberInclusive(1, 10),
    ];
    const sides = {
      dealer: {
        hand: [dealerFirstCard],
        sum: dealerFirstCard,
      },
      player: {
        hand: playerFirstHand,
        sum: playerFirstHand.reduce((partialSum, a) => partialSum + a, 0),
      },
    };
    embed.addFields(
      {
        name: "Dealer",
        value: `Hand: **[${cardEmotes[0]} ${sides.dealer.hand
          .map((card) => cardEmotes[card])
          .join(" ")}]**\nSum: **${sides.dealer.sum}**`,
      },
      {
        name: "You",
        value: `Hand: **[${sides.player.hand
          .map((card) => cardEmotes[card])
          .join(" ")}]**\nSum: **${sides.player.sum}**`,
      }
    );
    const msg = await interaction.reply({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(hitButton, standButton),
      ],
      fetchReply: true,
    });

    const filter = (i) => i.user.id == interaction.user.id;
    const collector = msg.createMessageComponentCollector({
      filter,
      idle: 1000 * 15,
    });

    collector.on("collect", async (i) => {
      if (i.customId == "stand") return collector.stop();

      await i.deferUpdate();

      const card = randNumberInclusive(1, 10);
      sides.player.hand.push(card);
      sides.player.sum += card;

      embed.setFields(embed.data.fields[0], {
        name: embed.data.fields[1].name,
        value: `Hand: **[${sides.player.hand
          .map((card) => cardEmotes[card])
          .join(" ")}]**\nSum: **${sides.player.sum}**`,
      });
      embed.setThumbnail(
        `https://cdn.discordapp.com/emojis/${cardEmotes[card].slice(
          -20,
          -1
        )}.png`
      );

      if (sides.player.sum >= 21) return collector.stop();

      await i.message.edit({ embeds: [embed] });
    });

    let content = "You tied with the dealer.";
    collector.on("end", async (_) => {
      await interaction.editReply({ embeds: [embed], components: [] });

      if (sides.player.sum > 21) {
        content = await lose(gambler, bet, embed);
        return;
      } else if (sides.player.sum == 21) {
        content = await win(gambler, bet, embed, true);
        return;
      }

      const facedownCard = randNumberInclusive(1, 7);
      sides.dealer.hand.splice(0, 0, facedownCard);
      sides.dealer.sum += facedownCard;

      embed.setFields(
        {
          name: embed.data.fields[0].name,
          value: `Hand: **[${sides.dealer.hand
            .map((card) => cardEmotes[card])
            .join(" ")}]**\nSum: **${sides.dealer.sum}**`,
        },
        embed.data.fields[1]
      );
      await interaction.editReply({ embeds: [embed] });

      await sleep(delay);

      while (sides.dealer.sum < 17) {
        const card = randNumberInclusive(1, 8);
        sides.dealer.hand.push(card);
        sides.dealer.sum += card;

        embed.setFields(
          {
            name: embed.data.fields[0].name,
            value: `Hand: **[${sides.dealer.hand
              .map((card) => cardEmotes[card])
              .join(" ")}]**\nSum: **${sides.dealer.sum}**`,
          },
          embed.data.fields[1]
        );

        await interaction.editReply({ embeds: [embed] });

        await sleep(delay);
      }
      if (sides.dealer.sum > 21 || sides.dealer.sum < sides.player.sum)
        content = await win(gambler, bet, embed);
      else if (sides.dealer.sum > sides.player.sum)
        content = await lose(gambler, bet, embed);

      await interaction.editReply({ content, embeds: [embed] });
    });
  },
};
