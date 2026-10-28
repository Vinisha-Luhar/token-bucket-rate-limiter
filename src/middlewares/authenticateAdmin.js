const crypto = require("node:crypto");

const authenticateAdmin = (req, res, next) => {
    
    const expectedKey = process.env.ADMIN_API_KEY;
    const providedKey = req.get("x-admin-api-key");

    if(!expectedKey)
    {
        return res.status(503).json({
            success: false,
            message: "Administrator authentication is not configured"
        });
    }

    if(!providedKey){
        return res.status(401).json({
            success: false,
            message: "Administrator API Key is Required"
        });
    }

    const expectedBuffer = Buffer.from(expectedKey,"utf-8");
    const providedBuffer = Buffer.from(providedKey,"utf-8");

    if(expectedBuffer.length !== providedBuffer.length || !crypto.timingSafeEqual(expectedBuffer, providedBuffer))
    {
        return res.status(401).json({
            success: false,
            message: "Administrator API Credentials"
        });
    }

    next();
};

module.exports = authenticateAdmin;