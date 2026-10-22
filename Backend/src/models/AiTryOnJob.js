const { Schema, model } = require('mongoose');

// One row per "Generate variant" click in the AI Studio screen (AI.html).
const aiTryOnJobSchema = new Schema(
  {
    status: { type: String, enum: ['QUEUED', 'PROCESSING', 'SUCCEEDED', 'FAILED'], default: 'QUEUED' },
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    staff: { type: Schema.Types.ObjectId, ref: 'Staff' },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    sourcePhotoUrl: { type: String, required: true }, // the uploaded user photo
    pose: String,
    lighting: String,
    environment: String,
    resultUrl: String,
    errorMessage: String,
    completedAt: Date,
  },
  { timestamps: true }
);

aiTryOnJobSchema.index({ status: 1 });

module.exports = model('AiTryOnJob', aiTryOnJobSchema);
