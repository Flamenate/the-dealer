const {
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { ErrorEmbed } = require("../../utils/embeds");
const { checkDMs } = require("../../utils/ensure");
const sleep = require("util").promisify(setTimeout);

module.exports = class KMC {
  static promptEmbed = new EmbedBuilder({
    author: { name: "Kumo no Canzone" },
    title: "Pick a Side",
    description: "",
    color: 0x5865f2,
  });
  static emotes = { Spider: "🕸️", Empty: "⚫" };

  constructor(uid, channel, p1, p2) {
    this.channel = channel;
    this.uid = uid;
    this.announcing = false;
    this.scores = { [p1.id]: 0, [p2.id]: 0 };
    this.spider = {
      user: p2,
      coin: null,
      actionRow: new ActionRowBuilder(),
    };
    this.traitor = {
      user: p1,
      coin: null,
      actionRow: new ActionRowBuilder(),
    };
    this.round = 0;
    for (const coin in KMC.emotes) {
      for (const role of ["spider", "traitor"])
        this[role].actionRow.addComponents(
          new ButtonBuilder({
            customId: `KMC-${this.uid}-${role}-${coin}`,
            label: coin,
            style: ButtonStyle.Primary,
            emoji: KMC.emotes[coin],
          })
        );
    }
  }

  async announce() {
    if (!this.spider.coin || !this.traitor.coin || this.announcing) return;

    this.announcing = true;
    let description;
    if (this.spider.coin == this.traitor.coin) {
      this.scores[this.spider.user.id]++;
      description = `**The Spider** (${this.spider.user}) wins the round.`;
    } else {
      this.scores[this.traitor.user.id]++;
      description = `**The Traitor** (${this.traitor.user}) wins the round.`;
    }
    await this.channel.send({
      embeds: [
        new EmbedBuilder({
          author: { name: "Kumo no Canzone" },
          title: `Round ${this.round} Results`,
          description,
          color: 0xf1c40f,
          fields: [
            {
              name: "Spider",
              value: `${this.spider.user} ${KMC.emotes[this.spider.coin]}`,
              inline: true,
            },
            {
              name: "Traitor",
              value: `${KMC.emotes[this.traitor.coin]} ${this.traitor.user} `,
              inline: true,
            },
          ],
        }),
      ],
    });
    await sleep(2 * 1000);
    this.inverseRoles();
  }

  async inverseRoles() {
    if (this.round == 3) return await this.endGame();

    this.announcing = false;
    this.round++;

    const oldSpider = this.spider.user;
    this.spider = {
      user: this.traitor.user,
      coin: null,
      actionRow: this.spider.actionRow,
    };
    this.traitor = {
      user: oldSpider,
      coin: null,
      actionRow: this.traitor.actionRow,
    };

    const { success, player } = await checkDMs(
      this.spider.user,
      this.traitor.user
    );
    if (!success) {
      this.channel.send({
        embeds: [
          new ErrorEmbed(
            `This game was cancelled because ${player} turned off their DMs.`
          ),
        ],
      });
      return delete this.channel.client.games.kmc[this.uid];
    }

    await this.spider.user.send({
      embeds: [
        KMC.promptEmbed.setDescription(
          "You are the **SPIDER**! Your goal is for the coins to match."
        ),
      ],
      components: [this.spider.actionRow],
    });
    await this.traitor.user.send({
      embeds: [
        KMC.promptEmbed.setDescription(
          "You are the **TRAITOR**! Your goal is for the coins to be different."
        ),
      ],
      components: [this.traitor.actionRow],
    });
  }

  async endGame() {
    await this.channel.send({
      embeds: [
        new EmbedBuilder({
          author: { name: "Kumo no Canzone" },
          title: "Game Results",
          color: 0x57f287,
          description:
            this.scores[this.spider.user.id] > this.scores[this.traitor.user.id]
              ? `${this.spider.user} wins!`
              : `${this.traitor.user} wins!`,
          footer: { text: "GGs." },
        }),
      ],
    });
    return delete this.channel.client.games.kmc[this.uid];
  }
};
