const {
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { ErrorEmbed } = require("../../utils/embeds");
const { checkDMs } = require("../../utils/ensure");
const sleep = require("util").promisify(setTimeout);

module.exports = class BVS {
  static promptEmbed = new EmbedBuilder({
    author: { name: "Boss v Salaryman" },
    description: `
		Possible Outcomes:

    • Offer **higher than** 50%:
	-Salaryman trusts: *100% of the sum* to the Salaryman.
	-Salaryman doesn't trust: *100% of the sum* to the Boss.

    • Offer **equal to** 50%:
	-Salaryman trusts: salary is *split* between the two.
	-Salaryman doesn't trust: *100% of the sum* to the Boss.

    • Offer **lower than** 50%:
	-Salaryman trusts: the offer is agreed on.
	-Salaryman doesn't trust: *100% of the sum* to the Salaryman.
		`,
    color: 0x5865f2,
  });

  constructor(uid, channel, p1, p2) {
    this.channel = channel;
    this.uid = uid;
    this.balances = { [p1.id]: 0, [p2.id]: 0 };
    this.boss = {
      user: p2,
      offer: null,
      actionRow: new ActionRowBuilder({
        components: [
          new ButtonBuilder({
            customId: `BVS-${this.uid}-boss`,
            label: "Set Percentage",
            emoji: "💼",
            style: ButtonStyle.Success,
          }),
        ],
      }),
    };
    this.salaryman = {
      user: p1,
      decision: "",
      actionRow: new ActionRowBuilder({
        components: [
          new ButtonBuilder({
            customId: `BVS-${this.uid}-salaryman-trust`,
            label: "Trust",
            emoji: "🤝",
            style: ButtonStyle.Success,
          }),
          new ButtonBuilder({
            customId: `BVS-${this.uid}-salaryman-trustn't`,
            label: "Don't Trust",
            emoji: "🚫",
            style: ButtonStyle.Danger,
          }),
        ],
      }),
    };
    this.sum = 1000;
    this.round = 0;
  }

  async announce() {
    let description;
    let bossProfit = 0;
    let salarymanProfit = 0;
    if (this.salaryman.decision == "trust") {
      if (this.boss.offer <= 50) {
        const partialSum = Math.floor((this.boss.offer / 100) * this.sum);
        salarymanProfit = partialSum;
        bossProfit = this.sum - partialSum;
        description = `The Salaryman (${this.salaryman.user}) **trusted** The Boss (${this.boss.user})'s **${this.boss.offer}%**...`;
      } else {
        salarymanProfit = this.sum;
        description = `The Salaryman (${this.salaryman.user}) **trusted** The Boss (${this.boss.user})'s **${this.boss.offer}%**, and ended up winning **100%**!`;
      }
    } else {
      if (this.boss.offer >= 50) {
        bossProfit = this.sum;
        description = `The Salaryman (${this.salaryman.user}) **didn't trust** The Boss (${this.boss.user})'s **${this.boss.offer}%**, and ended up winning **0%**...`;
      } else {
        salarymanProfit = this.sum;
        description = `The Salaryman (${this.salaryman.user}) **didn't trust** The Boss (${this.boss.user})'s **${this.boss.offer}%**, and ended up winning **100%**!`;
      }
    }
    this.balances[this.boss.user.id] += bossProfit;
    this.balances[this.salaryman.user.id] += salarymanProfit;

    await this.channel.send({
      embeds: [
        new EmbedBuilder({
          author: { name: "Boss v Salaryman" },
          title: "Round Results",
          description,
          color: 0xf1c40f,
          fields: [
            {
              name: "Boss",
              value: `**${
                this.boss.user
              } +$${bossProfit}**\nBalance: $${this.balances[
                this.boss.user.id
              ].toLocaleString()}`,
              inline: true,
            },
            {
              name: "Salaryman",
              value: `**${
                this.salaryman.user
              } +$${salarymanProfit}**\nBalance: $${this.balances[
                this.salaryman.user.id
              ].toLocaleString()}`,
              inline: true,
            },
          ],
        }),
      ],
    });

    await sleep(4 * 1000);
    this.inverseRoles();
  }

  async inverseRoles() {
    if (this.round == 3) return await this.endGame();

    this.round++;

    const oldBoss = this.boss.user;
    this.boss = {
      user: this.salaryman.user,
      offer: null,
      actionRow: this.boss.actionRow,
    };
    this.salaryman = {
      user: oldBoss,
      decision: null,
      actionRow: this.salaryman.actionRow,
    };

    const { success, player } = await checkDMs(
      this.boss.user,
      this.salaryman.user
    );
    if (!success) {
      this.channel.send({
        embeds: [
          new ErrorEmbed(
            `This game was cancelled because ${player} turned off their DMs.`
          ),
        ],
      });
      return delete this.channel.client.games.bvs[this.uid];
    }

    await this.boss.user.send({
      embeds: [BVS.promptEmbed.setTitle("You are the **BOSS**!")],
      components: [this.boss.actionRow],
    });
    await this.salaryman.user.send({
      embeds: [BVS.promptEmbed.setTitle("You are the **SALARYMAN**!")],
      components: [this.salaryman.actionRow],
    });
  }

  async endGame() {
    let description;
    if (
      this.balances[this.boss.user.id] > this.balances[this.salaryman.user.id]
    )
      description = `${this.boss.user} wins!`;
    else if (
      this.balances[this.boss.user.id] < this.balances[this.salaryman.user.id]
    )
      description = `${this.salaryman.user} wins!`;
    else description = `It's a draw 🤝`;
    await this.channel.send({
      embeds: [
        new EmbedBuilder({
          author: { name: "Boss v Salaryman" },
          title: "Game Results",
          color: 0x57f287,
          description,
          footer: { text: "GGs." },
        }),
      ],
    });
    return delete this.channel.client.games.bvs[this.uid];
  }
};
