const clientConfigService = require("../services/client_config_service");

class AdminController{

    async createClient(req, res, next){
        try{
            const client = await clientConfigService.createClient(req.body);
            return res.status(201).json({
                sucess: true,
                message: "Client Registered Successfully",
                data: client
            });
        }
        catch(error)
        {
            next(error);
        }
    }

    async getClient(req, res, next){
        try{
            const client = await clientConfigService.getClient(req.params.clientKey);
            return res.status(200).json({
                success: true,
                data: client
            });
        }
        catch(error){
            next(error);
        }
    }

    async updateClientLimits(req, res, next){
        try{
            const client = await clientConfigService.updateClientLimits(req.params.clientKey, req.body);
            return res.status(200).json({
                success: true,
                message: "Client Limits Updated Successfully",
                data: client
            });
        }
        catch(error){
            next(error);
        }
    }
}

module.exports = new AdminController();