import mongoose from "mongoose";
const callSchema = new mongoose.Schema({
  conversationId: ObjectId,
  participants: [ObjectId],
  type: { type: String, enum: ["video", "audio"] },
  startedAt: Date,
  endedAt: Date,
});
const Call = mongoose.model("Call", callSchema);
export default Call;
