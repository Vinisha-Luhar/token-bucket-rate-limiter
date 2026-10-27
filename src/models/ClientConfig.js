const mongoose = require("mongoose");

const clientConfigSchema = new mongoose.Schema({
    clientKey:{
        type: String,
        required: [true, "Client Key is Required"],
        unique: true,
        trim: true,
        minLength: 3,
        maxLength: 100,
        match: /^[a-zA-Z0-9_-]+$/,
    },

    algorithm:{
        type: String,
        required: true,
        enum: ["TOKEN_BUCKET","SLIDING_WINDOW"],
        default: "TOKEN_BUCKET"
    },
    requestsPerSecond: {
        type: Number,
        min: 0.01,
        max: 100000,
        required: function() {
            return this.algorithm === "TOKEN_BUCKET";
        }
    },

    burstSize: {
        type: Number,
        min: 1,
        max: 1000000,
        required: function () {
            return this.algorithm === "TOKEN_BUCKET"
        }
    },
    windowSizeMS: {
        type: Number,
      min: 1,
      max: 86400000,
      required: function () {
        return this.algorithm === "SLIDING_WINDOW";
      },
    },
    windowLimit: {
      type: Number,
      min: 1,
      max: 1000000,
      required: function () {
        return this.algorithm === "SLIDING_WINDOW";
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },

},
{
    timestamps: true,
    versionKey: false,
}
);

module.exports = mongoose.model("ClientConfig",clientConfigSchema);