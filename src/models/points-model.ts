import mongoose from "mongoose";


const pointsSchema = new mongoose.Schema({
    points: { type: Number, required: true },
    childid: { type: String, required: false },
    secondstoaccumulate: { type: Number, required: true },
    secondstospend: { type: Number, required: true },
}, { timestamps: true });

if(mongoose.models && mongoose.models['points']){
    delete mongoose.models['points']
}
const PointsModel = mongoose.model("points", pointsSchema);
export default PointsModel;
