import { model, Schema } from 'mongoose';

const commentSchema = new Schema(
  {
    faultId: {
      type: Schema.Types.ObjectId,
      ref: 'Fault',
      required: true,
      index: true,
    },
    authorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorRole: {
      type: String,
      enum: ['admin', 'manager', 'maintenanceWorker', 'safety'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },
  },
  { timestamps: true, versionKey: false },
);

export const Comment = model('Comment', commentSchema);
