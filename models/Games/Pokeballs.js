const {
  ActionRowBuilder,
  ButtonBuilder,
  EmbedBuilder,
  ButtonStyle,
} = require("discord.js");
const { ErrorEmbed } = require("../../utils/embeds");
const { checkDMs } = require("../../utils/ensure");
const sleep = require("util").promisify(setTimeout);

const delay = 2 * 1000;

module.exports = class Chinchiro {
  constructor(uid, channel, p1, p2) {
    this.channel = channel;
    this.uid = uid;
    this.announcing = false;

    const components = [];
    for (let i = 0; i < 4; i++)
      components.push(
        new ButtonBuilder({
          label: i.toString(),
          customId: `Poke-${this.uid}-${i}`,
          style: ButtonStyle.Secondary,
        })
      );

    this.players = {
      [p1.id]: {
        user: p1,
        pokeballs: 3,
        deployed: -1,
        guess: -1,
        actionRow: new ActionRowBuilder({ components }),
      },
      [p2.id]: {
        user: p2,
        pokeballs: 3,
        deployed: -1,
        guess: -1,
        actionRow: new ActionRowBuilder({ components }),
      },
    };
  }

  async announce() {
    const players = Object.values(this.players);
    if (players[0].guess == -1 || players[1].guess == -1 || this.announcing)
      return;

    this.announcing = true;
    const embed = new EmbedBuilder({
      author: { name: "3 Pokéballs" },
      title: "Round Results",
      description: `...`,
      color: 0xf1c40f,
    });
    const msg = await this.channel.send({ embeds: [embed] });
    await sleep(delay);

    const sum = players[0].deployed + players[1].deployed;
    let extra = "";

    if (players[0].guess == sum) {
      players[0].pokeballs--;
      players[0].actionRow = new ActionRowBuilder({
        components: players[0].actionRow.components.slice(0, -1),
      });
      extra += `${players[0].user} wins, -1 pokéball.\n`;
    }

    if (players[1].guess == sum) {
      players[1].pokeballs--;
      players[1].actionRow = new ActionRowBuilder({
        components: players[1].actionRow.components.slice(0, -1),
      });
      extra += `${players[1].user} wins, -1 pokéball.`;
    }

    embed.setDescription(
      `**${sum}** Pokéball${
        sum != 1 ? "s were deployed." : " was deployed."
      }\n${extra}`
    );
    embed.setFields(
      {
        name: players[0].user.username,
        value: `Pokéballs: **${players[0].pokeballs}**\nDeployed: **${players[0].deployed}**\nGuess: **${players[0].guess}**`,
        inline: true,
      },
      {
        name: players[1].user.username,
        value: `Pokéballs: **${players[1].pokeballs}**\nDeployed: **${players[1].deployed}**\nGuess: **${players[1].guess}**`,
        inline: true,
      }
    );

    await msg.edit({ embeds: [embed] });
    await sleep(delay);

    players[0].deployed =
      players[0].guess =
      players[1].deployed =
      players[1].guess =
        -1;

    this.sendPrompts();
  }

  async sendPrompts() {
    const players = Object.values(this.players);
    if (players[0].pokeballs == 0 || players[1].pokeballs == 0)
      return await this.endGame();

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
      return delete this.channel.client.games.poke[this.uid];
    }

    this.announcing = false;

    const embed = new EmbedBuilder({
      author: { name: "3 Pokéballs" },
      title: "Deploy your Pokéballs",
      color: 0x99aab5,
    });

    await players[0].user.send({
      embeds: [
        embed.setDescription(
          `You have **${players[0].pokeballs}** Pokéball${
            players[0].pokeballs != 1 ? "s" : ""
          }.\nSelect how many pokéballs you want to deploy.`
        ),
      ],
      components: [this.players[players[0].user.id].actionRow],
    });
    await players[1].user.send({
      embeds: [
        embed.setDescription(
          `You have **${players[1].pokeballs}** Pokéball${
            players[1].pokeballs != 1 ? "s" : ""
          }.\nSelect how many pokéballs you want to deploy.`
        ),
      ],
      components: [this.players[players[1].user.id].actionRow],
    });
  }

  async endGame() {
    const players = Object.values(this.players);

    let description;
    if (players[0].pokeballs == players[1].pokeballs)
      description = "It's a tie!";
    else if (players[0].pokeballs == 0)
      description = `${players[0].user} wins!`;
    else if (players[1].pokeballs == 0)
      description = `${players[1].user} wins!`;

    const embed = new EmbedBuilder({
      author: { name: "3 Pokéballs" },
      title: "Game Results",
      description,
      fields: [
        {
          name: players[0].user.username,
          value: `Pokéballs: **${players[0].pokeballs}**`,
          inline: true,
        },
        {
          name: players[1].user.username,
          value: `Pokéballs: **${players[1].pokeballs}**`,
          inline: true,
        },
      ],
      color: 0x57f287,
    });
    await this.channel.send({ embeds: [embed] });
    return delete this.channel.client.games.poke[this.uid];
  }
};
