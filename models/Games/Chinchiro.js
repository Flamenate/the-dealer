const {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
} = require("discord.js");
const { randNumberInclusive } = require("../../utils/random");
const { checkDMs } = require("../../utils/ensure");
const sleep = require("util").promisify(setTimeout);

module.exports = class Chinchiro {
  static emotes = [
    "<:d1:1054924940362649600>",
    "<:d2:1054924942459805846>",
    "<:d3:1054924943873282060>",
    "<:d4:1054924936965271683>",
    "<:d5:1054924938533941258>",
    "<:d6:1054924935300141090>",
  ];

  constructor(uid, channel, p1, p2) {
    this.channel = channel;
    this.uid = uid;
    this.announcing = false;
    this.players = {
      [p1.id]: { user: p1, dice: [], rerolls: 2, ready: false, score: 0 },
      [p2.id]: { user: p2, dice: [], rerolls: 2, ready: false, score: 0 },
    };
    this.actionRow = new ActionRowBuilder({
      components: [
        new ButtonBuilder({
          customId: `chinchi-${this.uid}-reroll`,
          label: "Reroll",
          style: ButtonStyle.Primary,
        }),
        new ButtonBuilder({
          customId: `chinchi-${this.uid}-ready`,
          label: "Ready",
          style: ButtonStyle.Success,
        }),
      ],
    });
    this.round = 0;
  }

  async announce() {
    const players = Object.values(this.players);
    if (!players[0].ready || !players[1].ready || this.announcing) return;

    this.announcing = true;
    const embed = new EmbedBuilder({
      author: { name: "Chinchiro" },
      title: "Round Results",
      description: "...",
      color: 0x206694,
    });
    const msg = await this.channel.send({ embeds: [embed] });

    const p1Value = this._evaluateRoll(players[0].dice);
    const p2Value = this._evaluateRoll(players[1].dice);

    if (p1Value == p2Value) embed.setDescription("It's a draw.");
    else if (p1Value > p2Value) {
      embed.setDescription(`${players[0].user} wins the round.`);
      players[0].score++;
    } else {
      embed.setDescription(`${players[1].user} wins the round.`);
      players[1].score++;
    }
    embed.setFields(
      {
        name: players[0].user.username,
        value: players[0].dice.map((el) => Chinchiro.emotes[el - 1]).join(" "),
        inline: true,
      },
      {
        name: players[1].user.username,
        value: players[1].dice.map((el) => Chinchiro.emotes[el - 1]).join(" "),
        inline: true,
      }
    );
    await sleep(2 * 1000);

    await msg.edit({ embeds: [embed] });

    await sleep(4 * 1000);

    this.sendPrompts();
  }

  _arraysEqual(arr1, arr2) {
    return arr1.every((el, i) => el == arr2[i]);
  }

  _evaluateRoll(dice) {
    if (this._arraysEqual(dice, [4, 5, 6])) return 15;
    if (this._arraysEqual(dice, [1, 2, 3])) return -1;
    const uniqueDice = dice.filter(
      (el, _, arr) => arr.indexOf(el) === arr.lastIndexOf(el)
    );
    if (uniqueDice.length == 3) return 0;
    const value = uniqueDice.length == 1 ? uniqueDice[0] : dice[0] * 2;
    return value;
  }

  rollDice(playerId) {
    const player = this.players[playerId];
    const embed = new EmbedBuilder({
      author: { name: "Chinchiro" },
      title: "Roll the Dice",
      description: `You have **${player.rerolls}** reroll${
        player.rerolls != 1 ? "s" : ""
      } left.`,
      color: 0xe67e22,
    });
    player.dice = [
      randNumberInclusive(1, 6),
      randNumberInclusive(1, 6),
      randNumberInclusive(1, 6),
    ];
    player.dice.sort();
    for (let i = 0; i < 3; i++)
      embed.addFields({
        name: `Die ${i + 1}`,
        value: Chinchiro.emotes[player.dice[i] - 1],
        inline: true,
      });

    return embed;
  }

  async sendPrompts() {
    const players = Object.values(this.players);
    if (this.round == 3) return await this.endGame();

    const { success, player } = await checkDMs(
      players[0].user,
      players[1].user
    );
    if (!success) {
      await this.channel.send({
        embeds: [
          new ErrorEmbed(
            `This game was cancelled because ${player} closed their DMs.`
          ),
        ],
      });
      return delete this.channel.client.games.chinchi[this.uid];
    }

    this.announcing = false;
    this.players = {
      [players[0].user.id]: {
        user: players[0].user,
        dice: [],
        rerolls: 2,
        ready: false,
        score: players[0].score,
      },
      [players[1].user.id]: {
        user: players[1].user,
        dice: [],
        rerolls: 2,
        ready: false,
        score: players[1].score,
      },
    };
    this.round++;
    await players[0].user.send({
      embeds: [this.rollDice(players[0].user.id)],
      components: [this.actionRow],
    });
    await players[1].user.send({
      embeds: [this.rollDice(players[1].user.id)],
      components: [this.actionRow],
    });
  }

  async endGame() {
    const players = Object.values(this.players);

    let description;
    if (players[0].score == players[1].score) description = "It's a tie!";
    else if (players[0].score > players[1].score)
      description = `${players[0].user} wins!`;
    else description = `${players[1].user} wins!`;

    const embed = new EmbedBuilder({
      author: { name: "Chinchiro" },
      title: "Game Results",
      description,
      fields: [
        {
          name: players[0].user.username,
          value: `Score: **${players[0].score}**`,
          inline: true,
        },
        {
          name: players[1].user.username,
          value: `Score: **${players[1].score}**`,
          inline: true,
        },
      ],
      color: 0x57f287,
    });
    await this.channel.send({ embeds: [embed] });
    return delete this.channel.client.games.chinchi[this.uid];
  }
};
