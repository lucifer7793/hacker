const categoryModel = require("./category.model");
const productModel = require("../products/products.model")

const get = async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const criterias = {};

    const [data, total] = await Promise.all([
        categoryModel
            .find(criterias)
            .limit(limit)
            .skip(skip)
            .lean(),
        categoryModel.countDocuments(criterias)
    ])

    return res.status(200).json({
        success: true,
        data: data,
        meta: { limit, page, total }
    })
}

const getAll = async (limit) => {
    if(limit) return await categoryModel.find().limit(limit)
    return await categoryModel.find()
}

const get2 = async (req) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const criterias = {};

    const [data, total] = await Promise.all([
        categoryModel
            .find(criterias)
            .limit(limit)
            .skip(skip)
            .lean(),
        categoryModel.countDocuments(criterias)
    ])
    console.log("get2", total)
    return {
        data: data,
        meta: { limit, page, total }
    }
}

const getDetail = async (req, res) => {
    const data = await categoryModel.findById(req.params.id).lean();

    if (!data) return res.status(400).json({
        message: "data does not exist",
        data: []
    })

    res.status(200).json({
        success: true,
        data: data
    });
}

const getDetail2 = async (req) => {
    const data = await categoryModel.findById(req.params.id).lean();

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
            return res.redirect('/admin/category/create');
        }

        const is_existed = await categoryModel.findOne({name: req.body.name});
        if(is_existed) {
            req.session.error = 'Danh mục đã tồn tại'
            return res.redirect('/admin/category/create');
        }

        const data = new categoryModel({
            name: req.body.name
        });
        console.log("cate tao oke----------------")

        await data.save();
        req.session.success = "Tạo thành công!"
        res.redirect('/admin/category/create');
    } catch (error) {
        // res.status(400).send(error);
        req.session.error = 'Tạo không thành công'
        return res.redirect('/admin/category/create');
    }
}

const update = async (req, res) => {
    try {
        const data = await categoryModel.findOne({ _id: req.params.id });

        if(!data) {
            req.session.error = 'Dữ liệu không tồn tại';
            return res.redirect('/admin/category/list');
        }

        for(const [key, value] of Object.entries(req.body)) {
            if(data[key]) data[key] = value
        }

        await data.save();

        req.session.success = "Cập nhật dữ liệu thành công";
        return res.redirect('/admin/category/list');
    } catch (error) {
        req.session.error = 'Cập nhật không thành công';
        return res.redirect('/admin/category/list');
    }
}

const deleteOne = async (req, res) => {
    try {
        const data = await categoryModel.findOne({ _id: req.params.id });
        if (!data) return res.status(400).json({
            message: "data does not exist",
            data: []
        })

        await categoryModel.deleteOne({ _id: req.params.id });
        await productModel.deleteMany({cate_id:req.params.id })
        res.status(200).json({
            message: "deleted successfully"
        });
    } catch (error) {
        res.status(400).send(JSON.stringify(error));
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
    getAll
}