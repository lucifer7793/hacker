const express = require("express");
const userRoute = require("./user")
const categoryRoute = require("./category")
const productRoute = require("./product");

const router = express.Router();

router.use("/users", userRoute);
router.use("/category", categoryRoute)
router.use("/product", productRoute)

module.exports = router