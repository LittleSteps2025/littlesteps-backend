import mongoose from 'mongoose';

const parentSchema = new mongoose.Schema({
  parent_id: { type: String, unique: true, required: true },
  parentName: { type: String, required: true },
  parentNIC: { type: String, required: true, unique: true },
  parentEmail: { type: String, required: true, unique: true },
  parentAddress: { type: String, required: true },
  parentContact: { type: String, required: true },
  password: { type: String, required: true },
  user_id: { type: String, required: true },
  token: { type: String },
  verified: { type: Boolean, default: false },
  noti_count: { type: Number, default: 0 }
});

export default mongoose.model('Parent', parentSchema);