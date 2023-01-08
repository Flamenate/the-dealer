const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { checkDMs } = require("../../utils/ensure");
const sleep = require("util").promisify(setTimeout);

const attackerActions = ["Shoot", "Dribble", "Fake"];
const defenderActions = ["Block", "Steal", "Wait"];

module.exports = class Basket {
  static attackerEmbed = new EmbedBuilder({
    author: { name: "TEIA no Basket" },
    title: "You're Attacking!",
    description: "Choose your action by clicking one of the buttons.",
    color: 0xed4245,
  });
  static defenderEmbed = new EmbedBuilder({
    author: { name: "TEIA no Basket" },
    title: "You're Defending!",
    description: "Choose your action by clicking one of the buttons.",
    color: 0x3498db,
  });

  constructor(uid, channel, p1, p2) {
    this.channel = channel;
    this.uid = uid;
    this.scores = {
      [p1.id]: 0,
      [p2.id]: 0,
    };
    this.attacker = {
      user: p1,
      action: null,
      actionRow: new ActionRowBuilder(),
    };
    this.defender = {
      user: p2,
      action: null,
      actionRow: new ActionRowBuilder(),
    };
    this.round = 0;
    this.disabledActions = []; //actions disabled this round due to attacker choosing fake
    this.goalChance = 1;
    this.resultEmbed = new EmbedBuilder({
      author: { name: "TEIA no Basket" },
      title: "Round 1",
      description: "Players are deciding...",
      fields: [
        {
          name: "Attacker",
          value: `<@${this.attacker.user.id}>\nPoints: **0**\nAction: **waiting...**`,
          inline: true,
        },
        {
          name: "Defender",
          value: `<@${this.defender.user.id}>\nPoints: **0**\nAction: **waiting...**`,
          inline: true,
        },
      ],
      color: 0x99aab5,
    });

    for (let i = 0; i < attackerActions.length; i++) {
      this.attacker.actionRow.addComponents(
        new ButtonBuilder({
          customId: `Basket-${this.uid}-attacker-${attackerActions[i]}`,
          label: attackerActions[i],
          style: ButtonStyle.Success,
        })
      );
      this.defender.actionRow.addComponents(
        new ButtonBuilder({
          customId: `Basket-${this.uid}-defender-${defenderActions[i]}`,
          label: defenderActions[i],
          style: ButtonStyle.Success,
        })
      );
    }
  }

  async updateEmbed(desc) {
    this.resultEmbed.setTitle(`Round ${this.round}`);
    this.resultEmbed.setFields(
      {
        name: "Attacker",
        value: `<@${this.attacker.user.id}>\nPoints: **${
          this.scores[this.attacker.user.id]
        }**\nAction: **${desc ? this.attacker.action : "waiting..."}**`,
        inline: true,
      },
      {
        name: "Defender",
        value: `<@${this.defender.user.id}>\nPoints: **${
          this.scores[this.defender.user.id]
        }**\nAction: **${desc ? this.defender.action : "waiting..."}**`,
        inline: true,
      }
    );

    if (desc) {
      this.resultEmbed.setDescription(desc);
      await this.attacker.user.send({ embeds: [this.resultEmbed] });
      await this.defender.user.send({ embeds: [this.resultEmbed] });
    }

    await this.channel.send({ embeds: [this.resultEmbed] });
    this.resultEmbed.setDescription("Players are deciding...");
  }

  async play() {
    if (!this.attacker.action || !this.defender.action) return;

    if (this.attacker.action == "Fake") return this.fake();
    switch (this.defender.action) {
      case "Block":
        if (this.attacker.action == "Shoot") this.block();
        else this.dribble();
        break;
      case "Steal":
        if (this.attacker.action == "Dribble") this.steal();
        else this.shot();
        break;
      case "Wait":
        if (this.attacker.action == "Shoot") this.shot();
        else this.dribble();
        break;
    }
    await sleep(3 * 1000);
    this.advance();
  }

  async advance() {
    const { success, player } = await checkDMs(
      this.attacker.user,
      this.defender.user
    );
    if (!success) {
      await this.channel.send({
        embeds: [
          new ErrorEmbed(
            `The game was cancelled because ${player} closed their DMs.`
          ),
        ],
      });
      return delete this.channel.client.games.basket[this.uid];
    }
    if (
      this.round >= 4 &&
      this.scores[this.attacker.user.id] != this.scores[this.defender.user.id]
    )
      return await this.endGame();
    this.disabledActions = [];
    this.goalChance = 1;
    this.round++;

    const oldDefender = this.defender.user;
    this.defender.user = this.attacker.user;
    this.attacker.user = oldDefender;

    this.defender.action = null;
    this.attacker.action = null;

    await this.defender.user.send({
      embeds: [Basket.defenderEmbed],
      components: [this.defender.actionRow],
    });
    await this.attacker.user.send({
      embeds: [Basket.attackerEmbed],
      components: [this.attacker.actionRow],
    });

    this.updateEmbed();
  }

  shot() {
    const accuracy = Math.random();
    if (accuracy > this.goalChance) {
      this.scores[this.defender.user.id] += 2;
      this.updateEmbed(
        `${this.attacker.user}'s shot goes past ${this.defender.user}, but it's gone wide!\n**+2** to the defender.`
      );
    } else {
      this.scores[this.attacker.user.id] += 3;
      this.updateEmbed(
        `${this.attacker.user}'s shot goes past ${this.defender.user} and beautifully slides into the net!\n**+3** to the attacker.`
      );
    }
  }

  block() {
    this.scores[this.defender.user.id] += 2;
    this.updateEmbed(
      `${this.attacker.user} tries to set up for a shot, but ${this.defender.user} is there to block it!\n**+2** to the defender.`
    );
  }

  dribble() {
    this.scores[this.attacker.user.id] += 2;
    this.updateEmbed(
      `${this.attacker.user} executes a beautiful dribble and goes around ${this.defender.user} in style!\n**+2** to the attacker`
    );
  }

  steal() {
    this.scores[this.defender.user.id] += 1;
    this.updateEmbed(
      `${this.attacker.user} tries to go for a dribble but ${this.defender.user} is there to steal it!\n**+1** to the defender.`
    );
  }

  async fake() {
    this.disabledActions = ["Fake", this.defender.action];
    await this.updateEmbed(
      `${this.attacker.user} fakes! ${this.defender.user} can't **${this.defender.action}** anymore.`
    );
    this.defender.action = null;
    this.attacker.action = null;

    this.defender.user.send({
      embeds: [Basket.defenderEmbed],
      components: [this.defender.actionRow],
    });
    this.attacker.user.send({
      embeds: [Basket.attackerEmbed],
      components: [this.attacker.actionRow],
    });

    this.updateEmbed();
  }

  async endGame() {
    let winner, loser;
    if (
      this.scores[this.attacker.user.id] > this.scores[this.defender.user.id]
    ) {
      winner = this.attacker;
      loser = this.defender;
    } else {
      winner = this.defender;
      loser = this.attacker;
    }
    await this.channel.send({
      embeds: [
        new EmbedBuilder({
          author: { name: "TEIA no Basket" },
          title: "Game Over!",
          color: 0x1f8b4c,
          description: `<@${winner.user.id}> wins **${
            this.scores[winner.user.id]
          }-${this.scores[loser.user.id]}**.`,
          footer: { text: "GG WP!" },
        }),
      ],
    });
    await winner.user.send({
      embeds: [
        new EmbedBuilder({
          author: { name: "TEIA no Basket" },
          title: "Game Over!",
          color: 0x57f287,
          description: `You won **${this.scores[winner.user.id]}-${
            this.scores[loser.user.id]
          }**.`,
          footer: { text: "GG EZ" },
        }),
      ],
    });
    await loser.user.send({
      embeds: [
        new EmbedBuilder({
          author: { name: "TEIA no Basket" },
          title: "Game Over!",
          color: 0x992d22,
          description: `You lost **${this.scores[winner.user.id]}-${
            this.scores[loser.user.id]
          }**.`,
          footer: { text: "You'll get 'em next time..." },
        }),
      ],
    });
    return delete this.channel.client.games.basket[this.uid];
  }
};
