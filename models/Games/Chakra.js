const {
  ButtonBuilder,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonStyle,
} = require("discord.js");
const { ErrorEmbed } = require("../../utils/embeds");
const { checkDMs } = require("../../utils/ensure");
const sleep = require("util").promisify(setTimeout);
const urlFromEmote = require("../../utils/urlFromEmote");

module.exports = class Chakra {
  static cards = {
    Earth: {
      emote: "<:earth:1055145768614375475>",
      beats: ["Water", "Wind"],
    },
    Fire: {
      emote: "<:fire:1055145757516247153>",
      beats: ["Earth", "Wind"],
    },
    Lightning: {
      emote: "<:lightning:1055145746397143051>",
      beats: ["Earth", "Fire"],
    },
    Water: {
      emote: "<:water:1055146015314935898>",
      beats: ["Fire", "Lightning"],
    },
    Wind: {
      emote: "<:wind:1055145728319688705>",
      beats: ["Water", "Lightning"],
    },
  };

  constructor(uid, channel, p1, p2) {
    this.channel = channel;
    this.uid = uid;
    this.announcing = false;
    this.p1 = {
      user: p1,
      cards: Object.keys(Chakra.cards),
      actionRow: new ActionRowBuilder(),
      pickedCard: null,
      score: 0,
    };
    this.p2 = {
      user: p2,
      cards: Object.keys(Chakra.cards),
      actionRow: new ActionRowBuilder(),
      pickedCard: null,
      score: 0,
    };
    this.rebuildActionRow("p1");
    this.rebuildActionRow("p2");
  }

  rebuildActionRow(p) {
    const player = this[p];
    player.actionRow = new ActionRowBuilder();
    for (const card in Chakra.cards)
      player.actionRow.addComponents(
        new ButtonBuilder({
          customId: `Chakra-${this.uid}-${p}-${card}`,
          label: card,
          emoji: Chakra.cards[card].emote,
          style: ButtonStyle.Primary,
          disabled: !player.cards.includes(card),
        })
      );
  }

  async announce() {
    if (!this.p1.pickedCard || !this.p2.pickedCard || this.announcing) return;

    this.announcing = true;
    const embed = new EmbedBuilder({
      author: { name: "Chakra Elements" },
      title: "Round Results",
      description: "...",
      color: 0x206694,
      fields: [
        {
          name: `${this.p1.user.username} (${this.p1.score})`,
          value: "?",
          inline: true,
        },
        {
          name: `${this.p2.user.username} (${this.p2.score})`,
          value: "?",
          inline: true,
        },
      ],
    });
    const msg = await this.channel.send({ embeds: [embed] });

    if (Chakra.cards[this.p1.pickedCard].beats.includes(this.p2.pickedCard)) {
      embed.setThumbnail(urlFromEmote(Chakra.cards[this.p1.pickedCard].emote));
      embed.setDescription(`${this.p1.user} wins the round.`);
      this.p1.score++;
    } else if (
      Chakra.cards[this.p2.pickedCard].beats.includes(this.p1.pickedCard)
    ) {
      embed.setThumbnail(urlFromEmote(Chakra.cards[this.p2.pickedCard].emote));
      embed.setDescription(`${this.p2.user} wins the round.`);
      this.p2.score++;
    } else {
      embed.setDescription("It's a draw 🤝");
    }

    embed.setFields(
      {
        name: `${this.p1.user.username} (${this.p1.score})`,
        value: `${Chakra.cards[this.p1.pickedCard].emote} **${
          this.p1.pickedCard
        }**`,
        inline: true,
      },
      {
        name: `${this.p2.user.username} (${this.p2.score})`,
        value: `${Chakra.cards[this.p2.pickedCard].emote} **${
          this.p2.pickedCard
        }**`,
        inline: true,
      }
    );
    await msg.edit({ embeds: [embed] });
    await sleep(3 * 1000);

    this.sendPrompts();
  }

  async sendPrompts() {
    if (this.p1.cards.length == 0) return this.endGame();

    const { success, player } = await checkDMs(this.p1.user, this.p2.user);
    if (!success) {
      await this.channel.send({
        embeds: [
          new ErrorEmbed(
            `This game was cancelled because ${player} closed their DMs.`
          ),
        ],
      });
      return delete this.channel.client.games.chakra[this.uid];
    }
    this.announcing = false;

    this.p1.pickedCard = null;
    this.p2.pickedCard = null;

    const defaultEmbed = new EmbedBuilder({
      author: { name: "Chakra Elements" },
      title: "Play a Card",
      description: `Rules:
			${Chakra.cards["Earth"].emote} **Earth** beats *${Chakra.cards["Water"].emote} Water* and *${Chakra.cards["Wind"].emote} Wind*.
			${Chakra.cards["Fire"].emote} **Fire** beats *${Chakra.cards["Earth"].emote} Earth* and *${Chakra.cards["Wind"].emote} Wind*.
			${Chakra.cards["Lightning"].emote} **Lightning** beats *${Chakra.cards["Water"].emote} Water* and *${Chakra.cards["Fire"].emote} Fire*.
			${Chakra.cards["Water"].emote} **Water** beats *${Chakra.cards["Fire"].emote} Fire* and *${Chakra.cards["Lightning"].emote} Lightning*.
			${Chakra.cards["Wind"].emote} **Wind** beats *${Chakra.cards["Water"].emote} Water* and *${Chakra.cards["Lightning"].emote} Lightning*.`,
      color: 0x3498db,
    });

    this.p1.user.send({
      embeds: [defaultEmbed],
      components: [this.p1.actionRow],
    });
    this.p2.user.send({
      embeds: [defaultEmbed],
      components: [this.p2.actionRow],
    });
  }

  async endGame() {
    let description;
    if (this.p1.score == this.p2.score) description = "It's a tie!";
    else if (this.p1.score > this.p2.score)
      description = `${this.p1.score} wins!`;
    else description = `${this.p2.score} wins!`;

    const embed = new EmbedBuilder({
      author: { name: "Chakra Elements" },
      title: "Game Results",
      description,
      fields: [
        {
          name: this.p1.user.username,
          value: `Score: **${this.p1.score}**`,
          inline: true,
        },
        {
          name: this.p2.user.username,
          value: `Score: **${this.p2.score}**`,
          inline: true,
        },
      ],
      color: 0x57f287,
    });
    await this.channel.send({ embeds: [embed] });
    return delete this.channel.client.games.chakra[this.uid];
  }
};
