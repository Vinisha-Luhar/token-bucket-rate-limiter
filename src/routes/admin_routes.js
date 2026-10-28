const express = require("express");

const authenticateAdmin = require("../middlewares/authenticateAdmin");
const validateRequest = require("../validators/validate_request");
const {createClientSchema,
    updateClientLimitsSchema } = require("../validators/clientconfig_validator");
const adminController = require("../controllers/admin_controller");

const router = express.Router();

router.use(authenticateAdmin);

router.post("/clients", 
    validateRequest(createClientSchema),
    (req, res, next) => adminController.createClient(req, res, next)
);

router.get("/clients/:clientKey",
    (req, res, next) => adminController.getClient(req, res, next)
);

router.put("/clients/:clientKey/limits",
    validateRequest(updateClientLimitsSchema),
    (req, res, next) => adminController.updateClientLimits(req, res, next)
);

module.exports = router;