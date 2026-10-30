const express = require("express");
const helmet = require("helmet");

const healthRoutes = require("./routes/health_routes.js");
const adminRoutes = require("./routes/admin_routes.js");
const ratelimitRoutes = require("./routes/ratelimit_routes.js");

const app = express();

app.use(helmet());
app.use(express.json({limit:"16kb"}));

app.use(healthRoutes);

app.use("/api/v1/admin",adminRoutes);

app.use("/api/v1/ratelimit",ratelimitRoutes);


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

     const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    console.error("Application error:", err.message);
  }

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500
        ? "Internal server error"
        : err.message,
  });

});

module.exports = app;