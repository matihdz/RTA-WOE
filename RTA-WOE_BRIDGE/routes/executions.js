const { Router } = require("express");
const { createExecution } = require("../controllers/posts");
const router = Router();

router.post("/", createExecution);

module.exports = router;
