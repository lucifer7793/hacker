const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    images: {
        type: Array,
        default: []
    }, 
    description: {
        type: String,
        default: ''
    },
    cate_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'category',
    },
    quantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        default: 0
    },
    // promottion: {
    //     type: Number,
    //     default: 0
    // }
});

const productModel = mongoose.model("product", productSchema);
module.exports = productModel;