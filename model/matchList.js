const mongoose = require("mongoose");

const matchListSchema = new mongoose.Schema({
  matchedIds: { type: [String], required: true },
  likedDataId: { type: mongoose.Types.ObjectId, ref: "Action", required: true },
  createdAt: { type: Date, default: Date.now },
});

const MatchLists = mongoose.model("MatchList", matchListSchema);
module.exports = MatchLists;
