module.exports = class Vote {
  constructor(uid, msg, choices, doubleVoterId) {
    this.uid = uid;
    this.msg = msg;
    this.choices = {};
    this.voters = [];
    choices.forEach((c) => (this.choices[c] = 0));
    this.doubleVoterId = doubleVoterId;
  }
};
