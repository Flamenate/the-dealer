const { MessageMentions } = require("discord.js");

module.exports = (input) => {
  const regex = new RegExp(MessageMentions.UsersPattern, "g");
  return {
    mentions: [...input.matchAll(regex)].map((arr) => arr[0]),
    ids: [...input.matchAll(regex)].map((arr) => arr[1]),
  };
};
