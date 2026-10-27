require("dotenv").config();

const app = require("./app");
const connectDatabase = require("./config/database");
const PORT = process.env.PORT;

const startServer = async() => {

    try{
        await connectDatabase();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch(error){
        console.error("Failed to start the server:", error.message);
        process.exit(1);
    }

};

startServer();