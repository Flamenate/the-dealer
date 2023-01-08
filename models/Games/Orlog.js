const {
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} = require("discord.js");
const sleep = require("util").promisify(setTimeout);
const { randChoice } = require("../../utils/random");
const { checkDMs } = require("../../utils/ensure");
const emote = "<a:dice_rolling:1018438670228922409>";

const rollDelay = 1000;
const fightDelay = 2.5 * 1000;

module.exports = class Orlog {
  static dice = {
    Arrow: { emoji: "🏹", desc: "Deal 2 Ranged Damage" },
    Axe: { emoji: "🪓", desc: "Deal 3 Melee Damage" },
    Shield: { emoji: "🛡️", desc: "Block 2 Ranged Damage" },
    Helmet: { emoji: "🪖", desc: "Block 3 Melee Damage" },
    Heal: { emoji: "❤️", desc: "Recover 1 HP" },
    Steal: {
      emoji: "🧲",
      desc: "Steal an unused heal from your opponent and use it.",
    },
  };
  static promptEmbed = new EmbedBuilder({
    title: "Organize your dice",
    description:
      "Select your action dice **__in order__** from the menu below.\nOnce you've ordered all 6 dice, close the menu to confirm.",
    color: 0xfffff0,
  });

  constructor(uid, channel, p1, p2) {
    this.channel = channel;
    this.uid = uid;
    this.p1 = {
      user: p1,
      hp: 10,
      availableDice: [],
      orderedDice: [],
      currentInstance: {
        meleeDamage: 0,
        rangeDamage: 0,
        meleeBlock: 0,
        rangedBlock: 0,
        heal: 0,
        healsToIgnore: 0,
      },
      menu: new StringSelectMenuBuilder({
        customId: `Orlog-${this.uid}-p1`,
        min_values: 6,
        max_values: 6,
        placeholder: "Select the dice in order...",
      }),
    };
    this.p2 = {
      user: p2,
      hp: 10,
      availableDice: [],
      orderedDice: [],
      currentInstance: {
        meleeDamage: 0,
        rangeDamage: 0,
        meleeBlock: 0,
        rangedBlock: 0,
        heal: 0,
        healsToIgnore: 0,
      },
      menu: new StringSelectMenuBuilder({
        customId: `Orlog-${this.uid}-p2`,
        min_values: 6,
        max_values: 6,
        placeholder: "Select the dice in order...",
      }),
    };
    this.round = 0;
    this.preRoundEmbed = new EmbedBuilder({
      author: { name: "Orlog 1v1" },
      title: "Round 1",
      color: 0x1abc9c,
      description: `${emote} Rolling the dice...`,
      fields: [
        {
          name: this.p1.user.username,
          value: "...",
          inline: true,
        },
        {
          name: this.p2.user.username,
          value: "...",
          inline: true,
        },
      ],
    });
  }

  async advance() {
    const { success, player } = await checkDMs(this.p1.user, this.p2.user);
    if (!success) {
      await this.channel.send({
        embeds: [
          new ErrorEmbed(
            `The game was cancelled because ${player} closed their DMs.`
          ),
        ],
      });
      return delete this.channel.client.games.orlog[this.uid];
    }

    this.fighting = false;
    this.round++;
    for (let i = 1; i < 3; i++) {
      const player = this[`p${i}`];
      player.availableDice = [];
      player.orderedDice = [];
      player.menu.setOptions();
    }

    this.preRoundEmbed.setTitle(`Round ${this.round}`);
    this.preRoundEmbed.setDescription(`${emote} Rolling the dice...`);
    this.preRoundEmbed.setFields(
      ...this.preRoundEmbed.data.fields.map((field) => {
        field.value = "...";
        return field;
      })
    );

    const message = await this.channel.send({
      embeds: [this.preRoundEmbed],
    });

    for (let i = 0; i < 6; i++) {
      await sleep(rollDelay);
      const fields = this.preRoundEmbed.data.fields;

      for (let j = 1; j < 3; j++) {
        const player = this[`p${j}`];
        const die = randChoice(Object.keys(Orlog.dice));
        player.availableDice.push(die);
        player.menu.addOptions({
          label: die,
          value: die + i.toString(), //i.toString() is irrelevant to code logic, it's only for value unicity
          emoji: Orlog.dice[die].emoji,
          description: Orlog.dice[die].desc,
        });
        fields[j - 1].value = player.availableDice
          .map((die) => `${Orlog.dice[die].emoji} ${die}`)
          .join("\n");
      }

      if (i == 5)
        this.preRoundEmbed.setDescription(
          "All the dice have been rolled! Please head over to your DMs to strategize."
        );
      this.preRoundEmbed.setFields(...fields);
      await message.edit({
        embeds: [this.preRoundEmbed],
      });
    }
    const promptEmbed = new EmbedBuilder(Orlog.promptEmbed)
      .setFooter({
        text: `Round: ${this.round}`,
      })
      .setFields(this.preRoundEmbed.data.fields);
    await this.p1.user.send({
      embeds: [promptEmbed],
      components: [new ActionRowBuilder({ components: [this.p1.menu] })],
    });
    await this.p2.user.send({
      embeds: [promptEmbed],
      components: [new ActionRowBuilder({ components: [this.p2.menu] })],
    });
  }

  async fight() {
    if (
      !this.p1.orderedDice.length ||
      !this.p2.orderedDice.length ||
      this.fighting
    )
      return;

    this.fighting = true;
    const fightEmbed = new EmbedBuilder({
      author: { name: "Orlog 1v1" },
      title: `Round ${this.round}: Fight!`,
      description: "The fight will begin in a few seconds...\n",
      fields: [
        {
          name: this.p1.user.username,
          value: `HP: **${this.p1.hp}**`,
          inline: true,
        },
        {
          name: this.p2.user.username,
          value: `> HP: **${this.p2.hp}**`,
          inline: true,
        },
      ],
      color: 0xbcc0c0,
    });
    const message = await this.channel.send({
      embeds: [fightEmbed],
    });
    await sleep(fightDelay);

    for (let i = 0; i < 6; i++) {
      for (let j = 1; j < 3; j++) {
        const player = this[`p${j}`];
        const die = player.orderedDice[i];
        switch (die) {
          case "Arrow":
            player.currentInstance.rangeDamage += 2;
            break;

          case "Shield":
            player.currentInstance.rangedBlock += 2;
            break;

          case "Axe":
            player.currentInstance.meleeDamage += 3;
            break;

          case "Helmet":
            player.currentInstance.meleeBlock += 3;
            break;

          case "Heal":
            player.currentInstance.heal++;
            break;

          case "Steal":
            const otherPlayer = j == "1" ? this.p2 : this.p1;
            if (
              otherPlayer.orderedDice.slice(i).filter((die) => die == "Heal")
                .length -
                otherPlayer.currentInstance.healsToIgnore >
              0
            ) {
              otherPlayer.currentInstance.healsToIgnore++;
              player.currentInstance.heal++;
            }
            break;
        }
      }
      if (
        this.p1.currentInstance.healsToIgnore &&
        this.p1.currentInstance.heal
      ) {
        this.p1.currentInstance.heal = 0;
        this.p1.currentInstance.healsToIgnore--;
      }
      this.p1.hp -=
        Math.max(
          0,
          this.p2.currentInstance.meleeDamage -
            this.p1.currentInstance.meleeBlock
        ) +
        Math.max(
          0,
          this.p2.currentInstance.rangeDamage -
            this.p1.currentInstance.rangedBlock
        ) -
        this.p1.currentInstance.heal;

      if (
        this.p2.currentInstance.healsToIgnore &&
        this.p2.currentInstance.heal
      ) {
        this.p2.currentInstance.heal = 0;
        this.p2.currentInstance.healsToIgnore--;
      }
      this.p2.hp -=
        Math.max(
          0,
          this.p1.currentInstance.meleeDamage -
            this.p2.currentInstance.meleeBlock
        ) +
        Math.max(
          0,
          this.p1.currentInstance.rangeDamage -
            this.p2.currentInstance.rangedBlock
        ) -
        this.p2.currentInstance.heal;

      this.p1.currentInstance = {
        meleeDamage: 0,
        rangeDamage: 0,
        meleeBlock: 0,
        rangedBlock: 0,
        heal: 0,
        healsToIgnore: this.p1.currentInstance.healsToIgnore,
      };
      this.p2.currentInstance = {
        meleeDamage: 0,
        rangeDamage: 0,
        meleeBlock: 0,
        rangedBlock: 0,
        heal: 0,
        healsToIgnore: this.p2.currentInstance.healsToIgnore,
      };

      fightEmbed.setFields(
        {
          name: this.p1.user.username,
          value: `HP: **${this.p1.hp}**`,
          inline: true,
        },
        {
          name: this.p2.user.username,
          value: `> HP: **${this.p2.hp}**`,
          inline: true,
        }
      );

      const p1move = this.p1.orderedDice[i];
      const p2move = this.p2.orderedDice[i];
      fightEmbed.setDescription(
        fightEmbed.data.description +
          `\n${Orlog.dice[p1move].emoji} **${p1move}** <== VS ==> ${Orlog.dice[p2move].emoji} **${p2move}**`
      );
      fightEmbed.setFooter({ text: `Dice Set: ${i + 1}` });
      await message.edit({ embeds: [fightEmbed] });

      if (this.p1.hp <= 0 || this.p2.hp <= 0) return await this.endGame();

      await sleep(fightDelay);
    }
    this.advance();
  }

  async endGame() {
    await this.channel.send({
      embeds: [
        new EmbedBuilder({
          author: { name: "Orlog 1v1" },
          title: "☠️ Death",
          color: 0x57f287,
          description:
            this.p1.hp <= 0 && this.p2.hp <= 0
              ? "It's a draw, GGs 🤝"
              : this.p1.hp <= 0
              ? `${this.p2.user} wins, GGs!`
              : `${this.p1.user} wins, GGs!`,
        }),
      ],
    });
    return delete this.channel.client.games.orlog[this.uid];
  }
};
