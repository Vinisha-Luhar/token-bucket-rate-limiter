const mongoose = require("mongoose");

const slidingWindowStateSchema = new mongoose.Schema({
    clientKey:{
        type: String,
        required: true,
        trim: true
    },
    requestTimestamps: {
        type: [Date],
        default: [],
        validate: {
            validator: function (timestamps) {
            return timestamps.length <= 10000;
            },
            message: "Too many timestamps stored in the window"
        }
    }
},
{
    timestamps: true,
    versionKey: false
}
);

slidingWindowStateSchema.index(
    {clientKey: 1},
    {unique: true}
);

module.exports = mongoose.model("SlidingWindowState",slidingWindowStateSchema);