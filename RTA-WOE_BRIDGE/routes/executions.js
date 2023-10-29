const { Router } = require("express");
const { createExecution } = require("../controllers/executions");
const router = Router();

router.post("/", createExecution);

module.exports = router;
