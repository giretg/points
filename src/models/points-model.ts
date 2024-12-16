import mongoose, { Schema, Document } from 'mongoose';

export interface IPoints extends Document {
  points: number;
  createdAt: Date;
}

const pointsSchema = new Schema<IPoints>({
  points: {
    type: Number,
    required: true,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const PointsModel = mongoose.models.Points || mongoose.model<IPoints>('Points', pointsSchema);

export default PointsModel;