import mongoose from "mongoose";
import {MongoMemoryServer} from "mongodb-memory-server";
import {beforeAll, afterAll, afterEach} from "vitest";

let mongoServer;

beforeAll(async() => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
},30000);

afterEach(async() => {
    const collections = mongoose.connection.collections;
    for (const collection of Object.values(collections)){
        await collection.deleteMany({});
    }
});

afterAll(async() => {
    await mongoose.disconnect();
    if(mongoServer){
        await mongoServer.stop();
    }
}, 3000);