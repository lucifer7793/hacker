const mongoose = require('mongoose');
const bcrypt = require("bcrypt")

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true
    },
    points: {
        type: Number,
        required: true,
        default: 0
    },
    role: {
        type: String,
        required: true,
        default: "USER"
    },
    manage_by: {
        type: String,
        default: process.env.manage_by || ""
    }
});

userSchema.pre('save', async function (next) {
    const user = this;
    user.password = await bcrypt.hashSync(user.password, 10);
  
    next();
  });

const userModel = mongoose.model("user", userSchema);
module.exports = userModel;