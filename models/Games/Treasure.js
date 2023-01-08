const {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
} = require("discord.js");
const sleep = require("util").promisify(setTimeout);
const { ErrorEmbed } = require("../../utils/embeds");
const { checkDMs } = require("../../utils/ensure");
const urlFromEmote = require("../../utils/urlFromEmote");

const delay = 1.5 * 1000;

module.exports = class Treasure {
  constructor(uid, channel, p1, p2) {
    this.channel = channel;
    this.uid = uid;
    this.scores = { [p1.id]: 0, [p2.id]: 0 };
    this.setter = {
      user: p2,
      position: null,
      actionRow: new ActionRowBuilder(),
    };
    this.guesser = {
      user: p1,
      position: null,
      actionRow: new ActionRowBuilder(),
    };
    this.round = 0;
    for (let i = 0; i < 4; i++) {
      this.setter.actionRow.addComponents(
        new ButtonBuilder({
          emoji: "<:TH_FD:1043184123914756126>",
          customId: `treasure-${this.uid}-setter-${i}`,
          style: ButtonStyle.Secondary,
        })
      );
      this.guesser.actionRow.addComponents(
        new ButtonBuilder({
          emoji: "<:TH_FD:1043184123914756126>",
          customId: `treasure-${this.uid}-guesser-${i}`,
          style: ButtonStyle.Secondary,
        })
      );
    }
    this.announcing = false;
  }

  async announce() {
    if (!this.setter.position || !this.guesser.position || this.announcing)
      return;

    this.announcing = true;
    const embed = new EmbedBuilder({
      author: { name: "Treasure Hoarders" },
      title: `Round ${this.round} Results`,
      description: "",
      fields: [
        {
          name: "Setter",
          value: `${this.setter.user} (${
            this.scores[this.setter.user.id]
          } pts)\nHand: [ ]`,
          inline: true,
        },
        {
          name: "Guesser",
          value: `${this.guesser.user} (${
            this.scores[this.guesser.user.id]
          } pts)\nGuess: **?**`,
          inline: true,
        },
      ],
      color: 0xfffff0,
    });
    const msg = await this.channel.send({ embeds: [embed] });

    let hand = "";
    await sleep(delay);

    for (let i = 0; i < 4; i++) {
      const card =
        i == this.setter.position
          ? "<:TH_TR:1043184132232052826> "
          : "<:TH_CR:1043182784358907915> ";

      const fields = embed.data.fields;
      if (i == this.guesser.position)
        fields[1].value = `${this.guesser.user} (${
          this.scores[this.guesser.user.id]
        } pts)\nGuess: **${parseInt(this.guesser.position) + 1}**`;

      embed.setThumbnail(urlFromEmote(card));

      hand += card + " ";
      fields[0].value = `${this.setter.user} (${
        this.scores[this.setter.user.id]
      } pts)\nHand: [ ${hand}]`;

      embed.setFields(...fields);
      await msg.edit({ embeds: [embed] });

      await sleep(delay);
    }
    if (this.guesser.position == this.setter.position) {
      embed.setColor(0x57f287);
      embed.setDescription(
        `${this.guesser.user} guessed correctly, **+3** pts!`
      );
      this.scores[this.guesser.user.id] += 3;
    } else {
      embed.setColor(0x992d22);
      embed.setDescription(
        `${this.guesser.user} did not guess correctly. ${this.setter.user} wins **+1 pt**`
      );
      this.scores[this.setter.user.id] += 1;
    }

    await msg.edit({ embeds: [embed] });

    await sleep(delay);
    this.inverseRoles();
  }

  async inverseRoles() {
    if (this.round >= 4) return await this.endGame();

    const { success, player } = await checkDMs(
      this.setter.user,
      this.guesser.user
    );
    if (!success) {
      await this.channel.send({
        embeds: [
          new ErrorEmbed(
            `The game was cancelled because ${player} closed their DMs.`
          ),
        ],
      });
      return delete this.channel.client.games.treasure[this.uid];
    }

    this.announcing = false;
    this.round++;
    const oldSetter = this.setter.user;
    this.setter = {
      user: this.guesser.user,
      position: null,
      actionRow: this.setter.actionRow,
    };

    this.guesser = {
      user: oldSetter,
      position: null,
      actionRow: this.guesser.actionRow,
    };

    await this.setter.user.send({
      embeds: [
        new EmbedBuilder({
          title: "YOU ARE THE SETTER",
          description: "**__SET__** the position of your treasure card.",
          color: 0xe67e22,
          footer: { text: `Round ${this.round}` },
        }),
      ],
      components: [this.setter.actionRow],
    });

    await this.guesser.user.send({
      embeds: [
        new EmbedBuilder({
          title: "Treasure Hoarders",
          description: "**__GUESS__** where the Setter will put their card.",
          color: 0x5865f2,
          footer: { text: `Round ${this.round}` },
        }),
      ],
      components: [this.guesser.actionRow],
    });

    await this.channel.send({
      embeds: [
        new EmbedBuilder({
          title: `Treasure Hoarders`,
          description: `Round **${this.round}**.`,
          fields: [
            {
              name: "Setter",
              value: `${this.setter.user} (${
                this.scores[this.setter.user.id]
              } pts)`,
              inline: true,
            },
            {
              name: "Guesser",
              value: `${this.guesser.user} (${
                this.scores[this.guesser.user.id]
              } pts)`,
              inline: true,
            },
          ],
          color: 0xf1c40f,
        }),
      ],
    });
  }

  async endGame() {
    const embed = new EmbedBuilder({
      title: "Treasure Hoarders",
      description:
        this.scores[this.setter.user.id] > this.scores[this.guesser.user.id]
          ? `${this.setter.user} wins!`
          : `${this.guesser.user} wins!`,
      fields: [
        {
          name: this.setter.user.username,
          value: `${this.scores[this.setter.user.id]} pts`,
          inline: true,
        },
        {
          name: this.guesser.user.username,
          value: `${this.scores[this.guesser.user.id]} pts`,
          inline: true,
        },
      ],
      color: 0xfffff0,
    });

    if (this.scores[this.setter.user.id] == this.scores[this.guesser.user.id])
      embed.setDescription("It's a tie.");

    await this.channel.send({ embeds: [embed] });

    return delete this.channel.client.games.treasure[this.uid];
  }
};
