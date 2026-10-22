const { Schema, model } = require('mongoose');

const contactMessageSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  phone: { type: String, required: true, trim: true, maxlength: 20 },
  message: { type: String, required: true, trim: true, maxlength: 3000 },
  status: { type: String, enum: ['NEW', 'READ', 'CLOSED'], default: 'NEW' },
}, { timestamps: true });

module.exports = model('ContactMessage', contactMessageSchema);
