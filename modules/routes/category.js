const express = require('express');
const CategoryController = require("../category/category.controller")

const router = express.Router();

router.get('/', CategoryController.get);
router.get('/:id', CategoryController.getDetail);
router.post('/', CategoryController.create);
router.post('/edit/:id', CategoryController.update);
router.delete('/:id', CategoryController.deleteOne);

module.exports = router