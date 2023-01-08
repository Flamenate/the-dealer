const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const { ErrorEmbed, GamblerEmbed } = require("../../utils/embeds");
const { checkDMs } = require("../../utils/ensure");
const { randNumberInclusive } = require("../../utils/random");
const sleep = require("util").promisify(setTimeout);

const endRoundDelay = 2 * 1000;
const rollDelay = 3 * 1000;

module.exports = class General {
  static units = {
    Soldier: {
      price: 1,
      die: 4,
      emote: "🪖",
      description: "Deals 1D4 Damage",
    },
    Cavalry: {
      price: 2,
      die: 6,
      emote: "🐎",
      description: "Deals 1D6 Damage",
    },
    General: {
      price: 3,
      die: 8,
      emote: "🎖️",
      description: "Deals 1D8 Damage",
    },
  };

  constructor(uid, channel, p1, p2) {
    this.channel = channel;
    this.uid = uid;
    this.fighting = false;
    this.p1 = {
      user: p1,
      points: 10,
      units: {
        Soldier: 0,
        Cavalry: 0,
        General: 0,
      },
      activeUnit: { unit: null, damage: null },
      actionRow: new ActionRowBuilder(),
    };
    this.p2 = {
      user: p2,
      points: 10,
      units: {
        Soldier: 0,
        Cavalry: 0,
        General: 0,
      },
      activeUnit: { unit: null, damage: null },
      actionRow: new ActionRowBuilder(),
    };
    this.rebuildActionRow("p1");
    this.rebuildActionRow("p2");
  }

  rebuildActionRow(p) {
    const player = this[p];
    player.actionRow = new ActionRowBuilder();
    for (const unit in General.units)
      player.actionRow.addComponents(
        new ButtonBuilder({
          customId: `GeneralBuy-${this.uid}-${p}-${unit}`,
          label: unit,
          emoji: General.units[unit].emote,
          style: ButtonStyle.Primary,
          disabled: player.points < General.units[unit].price,
        })
      );
  }

  rebuildEmbed(p) {
    const player = this[p];
    return new EmbedBuilder({
      title: "Buy Units",
      description: `Points Remaining: **${player.points}**\n\n-${Object.keys(
        General.units
      )
        .map(
          (unit) =>
            `[${player.units[unit]}] ${General.units[unit].emote} ${unit}: **${General.units[unit].price} points**`
        )
        .join("\n-")}`,
      color: 0x57f287,
    });
  }

  async endRound(msg, winner, loser) {
    this.fighting = false;

    const losingPlayer = this[loser];
    const winningPlayer = this[winner];

    const embed = new EmbedBuilder(msg.embeds[0]);
    embed.setDescription(
      `${winningPlayer.user}'s ${winningPlayer.activeUnit.unit} wins!`
    );
    embed.setFields(
      {
        name: `${winningPlayer.user.username} [${Object.values(
          winningPlayer.units
        ).reduce((acc, curr) => acc + curr)} units left]`,
        value: `${General.units[winningPlayer.activeUnit.unit].emote} ${
          winningPlayer.activeUnit.unit
        }: ⚔️ ${winningPlayer.activeUnit.damage}`,
        inline: true,
      },
      {
        name: `${losingPlayer.user.username} [${Object.values(
          losingPlayer.units
        ).reduce((acc, curr) => acc + curr)} units left]`,
        value: `☠️ ${losingPlayer.activeUnit.unit}: ⚔️ ${losingPlayer.activeUnit.damage}`,
        inline: true,
      }
    );
    msg.edit({ embeds: [embed] });

    losingPlayer.activeUnit.unit = { unit: null, damage: null };
    await sleep(endRoundDelay);

    if (Object.values(losingPlayer.units).reduce((acc, curr) => acc + curr) > 0)
      return this.unitPrompt(loser);

    await this.channel.send({
      embeds: [
        new EmbedBuilder({
          title: "Great General",
          description: `${winningPlayer.user} wins!`,
          color: 0x57f287,
        }),
      ],
    });
    return delete this.channel.client.games.general[this.uid];
  }

  async fight() {
    if (!this.p1.activeUnit.unit || !this.p2.activeUnit.unit || this.fighting)
      return;

    this.fighting = true;
    const msg = await this.channel.send({
      embeds: [
        new EmbedBuilder({
          title: "Great General",
          description: "🎲 Let the fight begin!",
          fields: [
            {
              name: `${this.p1.user.username} [${Object.values(
                this.p1.units
              ).reduce((acc, curr) => acc + curr)} units]`,
              value: `${General.units[this.p1.activeUnit.unit].emote} ${
                this.p1.activeUnit.unit
              }: 🎲`,
              inline: true,
            },
            {
              name: `${this.p2.user.username} [${Object.values(
                this.p2.units
              ).reduce((acc, curr) => acc + curr)} units]`,
              value: `${General.units[this.p2.activeUnit.unit].emote} ${
                this.p2.activeUnit.unit
              }: 🎲`,
              inline: true,
            },
          ],
          color: 0x992d22,
        }),
      ],
    });

    await sleep(rollDelay);

    this.p1.activeUnit.damage = randNumberInclusive(
      1,
      General.units[this.p1.activeUnit.unit].die
    );
    this.p2.activeUnit.damage = randNumberInclusive(
      1,
      General.units[this.p2.activeUnit.unit].die
    );

    if (this.p1.activeUnit.damage > this.p2.activeUnit.damage)
      return await this.endRound(msg, "p1", "p2");
    if (this.p2.activeUnit.damage > this.p1.activeUnit.damage)
      return await this.endRound(msg, "p2", "p1");

    if (
      General.units[this.p1.activeUnit.unit].price >
      General.units[this.p2.activeUnit.unit].price
    )
      return await this.endRound(msg, "p1", "p2");
    if (
      General.units[this.p2.activeUnit.unit].price >
      General.units[this.p1.activeUnit.unit].price
    )
      return await this.endRound(msg, "p2", "p1");

    this.fighting = false;
    const embed = new EmbedBuilder(msg.embeds[0]);
    embed.setDescription("It's a draw, re-fight!");
    embed.setFields(
      {
        name: this.p1.user.username,
        value: `${General.units[this.p1.activeUnit.unit].emote} ${
          this.p1.activeUnit.unit
        }: ⚔️ ${this.p1.activeUnit.damage}`,
        inline: true,
      },
      {
        name: this.p2.user.username,
        value: `${General.units[this.p2.activeUnit.unit].emote} ${
          this.p2.activeUnit.unit
        }: ⚔️ ${this.p2.activeUnit.damage}`,
        inline: true,
      }
    );
    msg.edit({ embeds: [embed] });

    await sleep(endRoundDelay);

    return await this.fight(); //if same damage and same price
  }

  async buyPrompt(p) {
    const player = this[p];
    const { success } = await checkDMs(player.user);
    if (!success) {
      await this.channel.send({
        embeds: [
          new ErrorEmbed(
            `The game is cancelled because ${player.user} closed their DMs.`
          ),
        ],
      });
      return delete this.channel.client.games.general[this.uid];
    }
    this.rebuildActionRow(p);
    await player.user.send({
      embeds: [this.rebuildEmbed(p)],
      components: [player.actionRow],
    });
  }

  async unitPrompt(p) {
    const player = this[p];
    const { success } = await checkDMs(player.user);
    if (!success) {
      await this.channel.send({
        embeds: [
          new ErrorEmbed(
            `The game is cancelled because ${player.user} closed their DMs.`
          ),
        ],
      });
      return delete this.channel.client.games.general[this.uid];
    }
    const menu = new StringSelectMenuBuilder({
      customId: `GeneralSelect-${this.uid}-${p}`,
      maxValues: 1,
      minValues: 1,
      placeholder: "Select a unit...",
    });
    for (const unit of Object.keys(player.units).filter(
      (u) => player.units[u] != 0
    )) {
      menu.addOptions({
        label: unit,
        value: unit,
        emoji: General.units[unit].emote,
        description: General.units[unit].description,
      });
    }
    const embed = new GamblerEmbed(player.user, {
      title: "Select Unit",
      description: `Available Units:\n-${Object.keys(player.units)
        .filter((u) => player.units[u] != 0)
        .map(
          (unit) =>
            `[${player.units[unit]}] ${General.units[unit].emote} **${unit}**`
        )
        .join("\n-")}`,
      color: 0x5865f2,
    });
    const actionRow = new ActionRowBuilder({ components: [menu] });
    await player.user.send({ embeds: [embed], components: [actionRow] });
  }
};
