// planModel.js
import * as sasl from 'saslprep';
import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  plan: Object,
  eventCode: {
    type: String,
    max: 50
  },
  planName: {
    type: String,
    max: 100
  },
  hostname: {
    type: String,
    max: 100
  },
  simple_id: Number,
  token: String,
  startDate: Date,
  screenshot: String,
  screenshot2: String,
  isScratch: Boolean,
  // name: {
  //   type: String,
  //   required: [true, 'Name field is required'],
  //   max: 200
  // }
}),
Plan = mongoose.model('plan', schema)
export default Plan
