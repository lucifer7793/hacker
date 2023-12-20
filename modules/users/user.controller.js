const userModel = require("./user.model");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');


const get = async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const criterias = {};

    if (req.query.search) {
        criterias["$or"] = [
            { name: { "$regex": new RegExp(req.query.search, "gi") } },
            { description: { "$regex": new RegExp(req.query.search, "gi") } }
        ]
    }

    const [data, total] = await Promise.all([
        userModel
            .find(criterias)
            .limit(limit)
            .skip(skip)
            .lean(),
        userModel.countDocuments(criterias)
    ])

    return res.status(200).json({
        success: true,
        data: data,
        meta: { limit, page, total }
    })
}

const get2 = async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const arrExcludeRole = ["SUPER_ADMIN"]
    const criterias = {
        role: { $nin: arrExcludeRole }
    };

    if(req.user) {
        if(req.user.role === "ADMIN") {

            criterias.manage_by = req.user._id,
            arrExcludeRole.push("ADMIN")
        }
    }

    if (req.query.search) {
        criterias["$or"] = [
            { name: { "$regex": new RegExp(req.query.search, "gi") } },
            { description: { "$regex": new RegExp(req.query.search, "gi") } }
        ]
    }

    const [data, total] = await Promise.all([
        userModel
            .find(criterias)
            .limit(limit)
            .skip(skip)
            .lean(),
        userModel.countDocuments(criterias)
    ])

    return {
        success: true,
        data: data,
        meta: { limit, page, total }
    }
}

const getDetail = async (req, res) => {
    const data = await userModel.findById(req.params.id).lean();

    if (!data) return res.status(400).json({
        message: "data does not exist",
        data: []
    })

    res.status(200).json({
        success: true,
        data: data
    });
}

const getDetail2 = async (req, res) => {
    const data = await userModel.findById(req.params.id).lean();

    if (!data) return {
        success: false,
        message: "Dữ liệu không tồn tại"
    }

    return {
        success: true,
        data: data
    };
}


const create = async (req, res) => {
    try { 
        if (!req.body.name) {
            req.session.error = 'Tên không được trống'
            return res.redirect('/admin/user/create');
        }

        if (!req.body.email) {
            req.session.error = 'Email không được trống'
            return res.redirect('/admin/user/create');
        }

        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
            req.session.error = 'Email Không hợp lệ'
            return res.redirect('/admin/user/create');
        }
 
        const is_existed = await userModel.findOne({ email: req.body.email });
        if(is_existed) {
            req.session.error = 'Đã có tài khoản đăng ký email này'
            return res.redirect('/admin/user/create');
        }

        const data = new userModel(req.body);

        await data.save();
        req.session.success = "Tạo thành công!"
        res.redirect('/admin/user/create');
    } catch (error) {
        // res.status(400).send(error);
        console.log("create user", error)
        req.session.error = 'Tạo không thành công'
        return res.redirect('/admin/user/create');
    }
}

const register = async (req, res) => {
    try { 
        if (!req.body.name) {
            req.session.error = 'Tên không được trống'
            return res.redirect('/register');
        }

        if (!req.body.email) {
            req.session.error = 'Email không được trống'
            return res.redirect('/register');
        }

        if (req.body.password !== req.body.re_password) {
            req.session.error = 'Mật khẩu nhập lại không trùng nhau'
            return res.redirect('/register');
        }

        if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
            req.session.error = 'Email Không hợp lệ'
            return res.redirect('/register');
        }
 
        const is_existed = await userModel.findOne({ email: req.body.email });
        if(is_existed) {
            req.session.error = 'Đã có tài khoản đăng ký email này'
            return res.redirect('/register');
        }
        req.body.manage_by = process.env.admin_id || "";
        req.body.role = "USER";

        const data = new userModel(req.body);

        await data.save();
        req.session.success = "Tạo thành công!"
        res.redirect('/login');
    } catch (error) {
        // res.status(400).send(error);
        console.log("create user", error)
        req.session.error = 'Tạo không thành công'
        return res.redirect('/register');
    }
}

const update = async (req, res) => {
    try {
        const data = await userModel.findOne({ _id: req.params.id });
        if(!data) {
            req.session.error = 'Dữ liệu không tồn tại';
            return res.redirect('/admin/user/list');
        }
        
        for(const [key, value] of Object.entries(req.body)) {
            if(data[key]) {
                data[key] = key === "points" ? parseInt(value) : value
            } else {
                if(key === "points") {
                    data[key] = parseInt(value) 
                }
            }
        }
        await data.save();

        req.session.success = "Cập nhật dữ liệu thành công";
        return res.redirect('/admin/user/list');
    } catch (error) {
        req.session.error = 'Cập nhật không thành công';
        return res.redirect('/admin/user/list');
    }
}

const deleteOne = async (req, res) => {
    try {
        const data = await userModel.findOne({ _id: req.params.id });
        if (!data) return res.status(400).json({
            message: "data does not exist",
            data: []
        })

        await userModel.deleteOne({ _id: req.params.id });
        res.status(200).json({
            message: "deleted successfully"
        });
    } catch (error) {
        res.status(400).send(JSON.stringify(error));
    }
}

const login = async (req, res) => {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
        req.session.error = 'Tài khoản không tồn tại.'
        return res.redirect('/login');
    }
    
    const check = await bcrypt.compareSync(password, user.password);

    if (!check) {
        req.session.error = 'Tài khoản hoặc mật khẩu không đúng!'
        return res.redirect('/login');
    }
  
    res.cookie('user_id', user._id);
  
    return res.redirect('/')
}

const admin_login = async (req, res) => {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
        req.session.error = 'Tài khoản không tồn tại.'
        return res.redirect('/admin/login');
    }

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
        req.session.error = 'Bạn không có quyền vào đây'
        return res.redirect('/admin/login');
    }
    
    const check = await bcrypt.compareSync(password, user.password);

    if (!check) {
        req.session.error = 'Tài khoản hoặc mật khẩu không đúng!'
        return res.redirect('/admin/login');
    }
  
    const accessToken = jwt.sign({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        manage_by: user.manage_by
    }, '123123');
    res.cookie('access_token', accessToken);
    res.redirect('/admin');
}

const change_password = async (req, res) => {
    try{
        const data = await userModel.findOne({ _id: req.params.id });
        if(!data) {
            req.session.error = 'Dữ liệu không tồn tại';
            return res.redirect('/admin/change-password');
        }

        if(!req.body.password) {
            req.session.error = 'Mật khẩu không được trống';
            return res.redirect('/admin/change-password');
        }

        if(req.body.password !== req.body.re_password) {
            req.session.error = 'Mật khẩu nhập lại không trùng';
            return res.redirect('/admin/change-password');
        }
        data.password = req.body.password;

        await data.save();

        req.session.success = "Cập nhật dữ liệu thành công";
        return res.redirect('/admin/change-password');
    } catch (error) {
        req.session.error = 'Cập nhật không thành công';
        return res.redirect('/admin/change-password');
    }
}

module.exports = {
    get,
    get2,
    getDetail,
    getDetail2,
    create,
    update,
    deleteOne,
    login,
    admin_login,
    register,
    change_password
}