module.exports = (emote) =>
  `https://cdn.discordapp.com/emojis/${
    [...emote.matchAll(/<:.+:(\d{18,19})>/g)][0][1]
  }.webp`;
