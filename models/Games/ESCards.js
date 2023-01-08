const {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
} = require("discord.js");
const { checkDMs } = require("../../utils/ensure");
const urlFromEmote = require("../../utils/urlFromEmote");
const sleep = require("util").promisify(setTimeout);

const delay = 2 * 1000;

module.exports = class ESCards {
  static emotes = {
    Citizen: "<:citizen:1057795231195615353>",
    Slave: "<:slave:1057795236920828004>",
    Emperor: "<:emperor:1057795234249052182>",
  };

  constructor(uid, channel, p1, p2) {
    this.channel = channel;
    this.uid = uid;
    this.announcing = false;
    this.p1 = {
      user: p1,
      cards: {
        Citizen: 3,
        Slave: 1,
        Emperor: 1,
      },
      played: false,
      score: 0,
    };
    this.p2 = {
      user: p2,
      cards: {
        Citizen: 3,
        Slave: 1,
        Emperor: 1,
      },
      played: false,
      score: 0,
    };
  }

  async sendPrompts() {
    const { success, player } = await checkDMs(this.p1.user, this.p2.user);
    if (!success) {
      await this.channel.send({
        embeds: [
          new ErrorEmbed(
            `This game was cancelled because ${player} closed their DMs.`
          ),
        ],
      });
      return delete this.channel.client.games.esc[this.uid];
    }
    this.announcing = false;

    this.p1.played = false;
    this.p2.played = false;

    this.p1.actionRow = new ActionRowBuilder();
    this.p2.actionRow = new ActionRowBuilder();
    for (const card in this.p1.cards) {
      for (let i = 1; i < 3; i++) {
        const player = this[`p${i}`];
        player.actionRow.addComponents(
          new ButtonBuilder({
            customId: `ESC-${this.uid}-p${i}-${card}`,
            label: `${card}: ${player.cards[card]}`,
            emoji: ESCards.emotes[card],
            style: ButtonStyle.Secondary,
            disabled: player.cards[card] <= 0,
          })
        );
      }
    }

    const embed = new EmbedBuilder({
      title: "ES Cards",
      color: 0xfffff0,
      description: "Choose your card:",
    });
    await this.p1.user.send({
      embeds: [embed],
      components: [this.p1.actionRow],
    });
    await this.p2.user.send({
      embeds: [embed],
      components: [this.p2.actionRow],
    });
  }

  async announce() {
    if (!this.p1.played || !this.p2.played || this.announcing) return;

    this.announcing = true;
    const embed = new EmbedBuilder({
      title: "ES Cards",
      color: 0xfffff0,
      description: "Round Results...",
      fields: [
        { name: this.p1.user.username, value: "...", inline: true },
        { name: this.p2.user.username, value: "...", inline: true },
      ],
    });
    for (const channel of [this.p1.user, this.p2.user])
      await channel.send({ embeds: [embed] });

    embed.setFields(
      {
        name: this.p1.user.username,
        value: `${ESCards.emotes[this.p1.played]} ${this.p1.played}`,
        inline: true,
      },
      {
        name: this.p2.user.username,
        value: `${ESCards.emotes[this.p2.played]} ${this.p2.played}`,
        inline: true,
      }
    );

    embed.setColor(0x206694);

    embed.setThumbnail(urlFromEmote(ESCards.emotes[this.p1.played]));
    if (this.p1.played == this.p2.played) embed.setDescription("It's a tie!");
    else if (
      (this.p1.played == "Emperor" && this.p2.played == "Citizen") ||
      (this.p1.played == "Citizen" && this.p2.played == "Slave") ||
      (this.p1.played == "Slave" && this.p2.played == "Emperor")
    ) {
      embed.setDescription(`${this.p1.user} wins the round!`);
      this.p1.score++;
    } else {
      embed.setThumbnail(urlFromEmote(ESCards.emotes[this.p2.played]));
      embed.setDescription(`${this.p2.user} wins the round!`);
      this.p2.score++;
    }

    await sleep(delay);
    for (const channel of [this.p1.user, this.p2.user, this.channel])
      await channel.send({ embeds: [embed] });

    await sleep(delay);
    if (Object.values(this.p1.cards).reduce((acc, val) => acc + val) > 0)
      return this.sendPrompts();

    this.endGame();
  }

  async endGame() {
    const finalEmbed = new EmbedBuilder({
      title: "ES Cards",
      color: 0x57f287,
      fields: [
        {
          name: this.p1.user.username,
          value: this.p1.score.toString(),
          inline: true,
        },
        {
          name: this.p2.user.username,
          value: this.p2.score.toString(),
          inline: true,
        },
      ],
    });
    const winEmbed = new EmbedBuilder({
      title: "ES Cards",
      description: "You won the game!",
      color: 0x57f287,
      fields: finalEmbed.data.fields,
      footer: { text: "gg ez" },
    });
    const lossEmbed = new EmbedBuilder({
      title: "ES Cards",
      description: "You lost the game...",
      color: 0x992d22,
      fields: finalEmbed.data.fields,
      footer: { text: "gg wp" },
    });

    if (this.p1.score > this.p2.score) {
      finalEmbed.setDescription(`${this.p1.user} wins!`);
      this.channel.send({ embeds: [finalEmbed] });
      this.p1.user.send({ embeds: [winEmbed] });
      this.p2.user.send({ embeds: [lossEmbed] });
    } else if (this.p2.score > this.p1.score) {
      finalEmbed.setDescription(`${this.p2.user} wins!`);
      this.channel.send({ embeds: [finalEmbed] });
      this.p2.user.send({ embeds: [winEmbed] });
      this.p1.user.send({ embeds: [lossEmbed] });
    } else {
      finalEmbed.setDescription("Game Over! It's a DRAW!");
      finalEmbed.setColor(0xf1c40f);
      for (const channel of [this.p1.user, this.p2.user, this.channel])
        await channel.send({ embeds: [finalEmbed] });
    }
    return delete this.channel.client.games.esc[this.uid];
  }
};
