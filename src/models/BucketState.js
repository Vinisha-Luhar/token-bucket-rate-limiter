const mongoose = require("mongoose");

const bucketStateSchema = new mongoose.Schema({
    clientKey:{
        type: String,
        required: true,
        trim: true
    },
    tokens: {
        type: Number,
        required: true,
        min: 0
    },
    lastRefillAt:{
        type: Date,
        required: true
    }
},
{
    timestamps: true,
    versionKey: false
}
);

bucketStateSchema.index(
    {clientKey: 1},
    {unique: true}
);

module.exports = mongoose.model("BucketState",bucketStateSchema);