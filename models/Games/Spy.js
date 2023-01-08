module.exports = class Spy {
  constructor(uid, channel, spyId, playerIds) {
    this.channel = channel;
    this.uid = uid;
    this.spy = { id: spyId, votes: 0 };
    this.players = {};
    playerIds.forEach((pid) => (this.players[pid] = false));
  }
};
