const express = require('express');
const UserController = require("../users/user.controller")

const router = express.Router();

router.get('/', UserController.get);
router.get('/:id', UserController.getDetail);
router.post('/', UserController.create);
router.post('/edit/:id', UserController.update);
router.post('/change-password/:id', UserController.change_password);
router.delete('/:id', UserController.deleteOne);
// router.post('/login', UserController.login);

module.exports = router