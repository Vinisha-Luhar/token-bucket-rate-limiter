const clientConfigModel = require("../models/ClientConfig")

class ClientConfigService {

    async createClient(data){

        const existingClient = await clientConfigModel.exists({
            clientKey: data.clientKey
        });

        if(existingClient){
            const error = new Error("Client Already Exists");
            error.statusCode = 409;
            throw error;
        }

        try{
            await clientConfigModel.create(data);
        }
        catch(err){
            if(err.code === 11000){
                const duplicateError = new Error("Client Already Exists");
                duplicateError.statusCode = 409;
                throw duplicateError;
            }
            throw err;
        }

        
    }

    async getClient(clientKey){

        const client = await clientConfigModel.findOne({clientKey: clientKey}).lean();

        if(!client){
            const error = new Error("Error Not Found");
            error.statusCode = 404;
            throw error;
        }

        return client;
    }

    async updateClientLimits(clientKey, data){

        const client = await clientConfigModel.findOne({clientKey: clientKey});

        if(!client){
            const error = new Error("Client Not Found");
            error.statusCode = 404;
            throw error;
        }

        client.algorithm = data.algorithm;

        if(client.algorithm === "TOKEN_BUCKET")
        {
            client.requestsPerSecond = data.requestsPerSecond;
            client.burstSize = data.burstSize;
            client.windowSizeMS = undefined;
            client.windowLimit = undefined;
        }
        else
        {
            client.windowSizeMS = data.windowSizeMS;
            client.windowLimit = data.windowLimit;
            client.requestsPerSecond = undefined;
            client.burstSize = undefined;
        }

        await client.save();

        return client;
    }

};

module.exports = new ClientConfigService();