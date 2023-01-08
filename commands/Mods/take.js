const { SlashCommandBuilder } = require("discord.js");
const Gambler = require("../../models/Systems/Gambler");
const { GamblerEmbed } = require("../../utils/embeds");
const { forceDocument } = require("../../utils/ensure");

const data = new SlashCommandBuilder()
  .setName("take")
  .setDescription("Take a sum of money from someone.")
  .addUserOption((opt) =>
    opt
      .setName("user")
      .setDescription("The user you want to remove money from.")
      .setRequired(true)
  )
  .addNumberOption((opt) =>
    opt
      .setName("sum")
      .setDescription("The sum of money in question.")
      .setRequired(true)
      .setMinValue(1)
  );

module.exports = {
  data: data,
  async execute(interaction) {
    await interaction.deferReply();

    const user = interaction.options.getUser("user");
    const gambler = await forceDocument(user);
    const sum = interaction.options.getNumber("sum");
    gambler.balance -= sum;
    await Gambler.updateOne({ _id: gambler._id }, { $inc: { balance: -sum } });

    await interaction.editReply({
      embeds: [
        new GamblerEmbed(user, {
          title: "Money Deducted",
          description: `${user} just lost **$${sum.toLocaleString()}**.`,
          thumbnail: { url: user.displayAvatarURL() },
          color: 0x992d22,
          footer: {
            text: `Courtesy of ${interaction.user.username}`,
          },
          fields: [
            {
              name: "Balance",
              value: `$${gambler.balance.toLocaleString()}`,
            },
          ],
        }),
      ],
    });
  },
};
