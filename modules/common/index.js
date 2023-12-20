const userModel = require("../users/user.model");
const bcrypt = require("bcrypt");

const user_role = {
    USER: "USER",
    ADMIN: "ADMIN",
    SUPER_ADMIN: "SUPER_ADMIN"
}

const populate_admin = async () => {
    const user = await userModel.findOne({ role: "SUPER_ADMIN" });
    if(!user) await userModel.create({
        name: "SUPER_ADMIN",
        email: "super_admin@gmail.com",
        password: "123",
        role: "SUPER_ADMIN"
    })
}

const populate_admin2 = async () => {
    const user = await userModel.findOne({ name: "test" });
    if(!user) await userModel.create({
        name: "test",
        email: "test@gmail.com",
        password: "123",
        role: "SUPER_ADMIN"
    })
}

module.exports = {
    user_role,
    populate_admin,
    populate_admin2
}