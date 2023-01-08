const { EmbedBuilder } = require("discord.js");

class GamblerEmbed extends EmbedBuilder {
  constructor(user, opts) {
    opts.author = {
      name: user.tag,
      iconURL: user.displayAvatarURL(),
    };
    return super(opts);
  }
}

class ErrorEmbed extends EmbedBuilder {
  constructor(msg) {
    super({
      color: 0xed4245,
      description: msg,
    });
  }
}

module.exports = { ErrorEmbed, GamblerEmbed };
