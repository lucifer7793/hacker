const express = require('express');
const multer = require('multer');
const ProductController = require("../products/products.controller")

const upload = multer({
    // Configure storage engine
    storage: multer.diskStorage({
        destination: 'uploads/', // Set upload destination
        filename: function (req, file, cb) {
            // Generate unique filename
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop().toLowerCase());
        }
    }),
    // Limit file size
    limits: { fileSize: 10_000_000 }, // 10MB limit
    // Filter file types
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(png|jpg|jpeg)$/gi)) {
            return cb(new Error('Only images are allowed!'));
        }
        cb(null, true);
    }
});

const router = express.Router();

router.get('/', ProductController.get);
router.get('/:id', ProductController.getDetail);
router.post('/', upload.array('files'), ProductController.create);
router.post('/edit/:id', upload.array('files'), ProductController.update);
router.delete('/:id', ProductController.deleteOne);

module.exports = router