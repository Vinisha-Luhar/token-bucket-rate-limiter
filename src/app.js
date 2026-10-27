const express = require("express");
const helmet = require("helmet");

const health_routes = require("./routes/health_routes.js");

const app = express();

app.use(helmet());
app.use(express.json({limit:"16kb"}));
app.use(health_routes);

app.use((req,res) => {
    return res.status(404).json({
        success: false,
        message: "Route Not Found"
    });
});

app.use((err,req,res,next)=>{
    if(res.headersSent){
        return next(err);
    }

    if(err.type == "entity.parse.failed")
    {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON request body"
        });
    }

     console.error("Unexpected application error:", err.message);

    return res.status(500).json({
        success: false,
        message: "Internal server error",
    });

});

module.exports = app;