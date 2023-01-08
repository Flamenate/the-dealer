const {
  ModalBuilder,
  ActionRowBuilder,
  TextInputStyle,
  TextInputBuilder,
} = require("discord.js");

const modal = new ModalBuilder({
  title: "Guessing Round",
  components: [
    new ActionRowBuilder({
      components: [
        new TextInputBuilder({
          label: "Guess how many Pokéballs have been deployed",
          customId: "guess",
          placeholder: "Your Guess...",
          style: TextInputStyle.Short,
          maxLength: 1,
          required: true,
        }),
      ],
    }),
  ],
});

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (interaction.customId?.slice(0, 16) != "pokeTriggerModal") return;

    const uid = interaction.customId.split("-")[1];
    await interaction.showModal(modal.setCustomId(`pokeModal-${uid}`));
  },
};
