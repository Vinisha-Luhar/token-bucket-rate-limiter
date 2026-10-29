const clientConfigModel = require("../models/ClientConfig");
const slidingWindowStateModel = require("../models/SlidingWindowState");

class SlidingWindowService{

    async checkRequest(clientKey){
        const config = await clientConfigModel.findOne(
            {
                clientKey,
                isActive: true
            }
        ).lean();

        if(!config){
            const error = new Error("Client Not Found or Inactive");
            error.statusCode = 404;
            throw error;
        }

        if(config.algorithm !== "SLIDING_WINDOW")
        {
            const error = new Error("Client is not configured to use the SLIDING WINDOW algorithm");
            error.statusCode = 400;
            throw error;
        }

        const {windowSizeMs, windowLimit} = config;

        const now = new Date();
        const cutoffTime = new Date(now.getTime() - windowSizeMs);

        try{

            await slidingWindowStateModel.updateOne(
                {clientKey},
                {
                    $setOnInsert: {
                        clientKey,
                        requestTimestamps: []
                    }
                },
                {
                    upsert: true
                }
            );

        }
        catch(error){
            if(error.code !== 11000)
            {
                throw error;
            }
        }


        const collection = slidingWindowStateModel.collection;

         const result = await collection.findOneAndUpdate(
            {
                clientKey,
                $expr: {
                    $lt: [
                            {
                                $size: {
                                    $filter: {
                                        input: "$requestTimestamps",
                                        as: "timestamp",
                                        cond: {
                                            $gt: ["$$timestamp", cutoffTime]
                                        }
                                    }
                                }
                            },
                        windowLimit
                    ]
                }
            },
            [
            {
                $set: {
                    requestTimestamps: {
                    $concatArrays: [
                        {
                            $filter: {
                                input: "$requestTimestamps",
                                as: "timestamp",
                                cond: {
                                    $gt: ["$$timestamp", cutoffTime]
                                }
                            }
                        },
                        ["$$NOW"]
                    ]
                },
                updatedAt: "$$NOW"
                }
            }
        ],
        {
            returnDocument: "after"
        });


        const updatedState = result.value ?? result;

        if(!updatedState || !updatedState.requestTimestamps)
        {
            const state = await slidingWindowStateModel.findOne({
                clientKey
            }).lean();

            if(!state){
                const error = new Error("Sliding Window State Not Found");
                error.statusCode = 500;
                throw error;
            }

            const activeTimestamps = state.requestTimestamps.filter(
                timestamp => timestamp.getTime() > cutoffTime.getTime()
            ).sort((a,b) => a.getTime() - b.getTime());

            const oldestTimestamp = activeTimestamps[0];

            const retryAfterSeconds = Math.max(0,Math.ceil((oldestTimestamp.getTime() + windowSizeMs - Date.now())/1000));

            return {
                allowed: false,
                clientKey,
                limit: windowLimit,
                remaining: 0,
                retryAfterSeconds,
                resetAfterSeconds: retryAfterSeconds
            };
        }

        const remaining = Math.max(0,
            windowLimit - updatedState.requestTimestamps.length 
        );

        const activeTimestamps = updatedState.requestTimestamps
        .map(timestamp => new Date(timestamp))
        .filter(timestamp => timestamp.getTime() > cutoffTime.getTime())
        .sort((a, b) => a.getTime() - b.getTime());

        const oldestTimestamp = activeTimestamps[0];

        const resetAfterSeconds = oldestTimestamp
        ? Math.max(
            0,
            Math.ceil(
                (
                oldestTimestamp.getTime() +
                windowSizeMs -
                Date.now()
                ) / 1000
            )
            )
        : 0;

        return {
            allowed: true,
            clientKey,
            limit: windowLimit,
            remaining,
            retryAfterSeconds: 0,resetAfterSeconds
        };
    }

}

module.exports = new SlidingWindowService();