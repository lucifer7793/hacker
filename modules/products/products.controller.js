const mongoose = require("mongoose");
const ObjectId = mongoose.Types.ObjectId;
const productModel = require("./products.model");
const categoryModel = require("../category/category.model")

const get = async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const criterias = {};

    if (req.query.search) {
        criterias["$or"] = [
            { name: { "$regex": new RegExp(req.query.search, "gi") } }
        ]
    }

    const [data, total] = await Promise.all([
        productModel
            .find(criterias)
            .populate("cate_id")
            .limit(limit)
            .skip(skip)
            .lean(),
        productModel.countDocuments(criterias)
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
    const criterias = {
        
    };

    if (req.query.search) {
        criterias["$or"] = [
            { name: { "$regex": new RegExp(req.query.search, "gi") } }
        ]
    }

    const [data, total] = await Promise.all([
        productModel
            .find(criterias)
            .populate("cate_id")
            .limit(limit)
            .skip(skip)
            .lean(),
        productModel.countDocuments(criterias)
    ])

    return {
        data: data,
        meta: { limit, page, total }
    }
}

const getby = async (req, res) => {
    const limit = parseInt(req.query.limit) || 16;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;
    const criterias = {};
    let name_cate = "Các sản phẩm";

    if (req.query.cate_id) {
        criterias.cate_id = req.query.cate_id;
        const cate = await categoryModel.findOne({_id: req.query.cate_id});
        name_cate = cate.name;
    }

    if(req.query.search) {
        criterias.name = { "$regex": new RegExp(req.query.search, "gi") }
    }

    const [data, total, arrCate] = await Promise.all([
        productModel
            .find(criterias)
            .populate("cate_id")
            .limit(limit)
            .skip(skip)
            .lean(),
        productModel.countDocuments(criterias),
        categoryModel.find().limit(10)
    ])

    return {
        data: data,
        meta: { limit, page, total },
        arrCate,
        name_cate
    }
}

const getDetail = async (req, res) => {
    const data = await productModel.findById(req.params.id).lean();

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
    const id = req.params.id || req.query.id;
    const data = await productModel.findById(id).lean();

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
        if(!req.files) {
            req.session.error = 'bạn phải đăng ảnh sản phẩm'
            return res.redirect('/admin/product/create');
        }

        const check = await productModel.findOne({
            name: req.body.name,
            cate_id: req.body.cate_id
        })
        if(check) {
            req.session.error = 'Sản phẩm này của danh mục đã tồn tại'
            return res.redirect('/admin/product/create');
        }


        const data = new productModel({
            ...req.body,
            images: req.files.map(v => v.filename)
        }
        );
        await data.save();
        req.session.success = "Tạo thành công!"
        res.redirect('/admin/product/create');
    } catch (error) {
        console.log(error)
        req.session.error = 'Tạo không thành công'
        return res.redirect('/admin/product/create');
    }
}

const update = async (req, res) => {
    try {
        const data = await productModel.findOne({ _id: req.params.id });
        if (!data) {
            req.session.error = 'Sản phẩm không tồn tại'
            return res.redirect('/admin/product/list');
        }

        for(const [key, value] of Object.entries(req.body)) {
            if(data[key]) data[key] = value
        }
        
        if(req.files.length > 0) {
            data.images = req.files.map(v => v.filename)
        }

        await data.save();

        req.session.success = "Cập nhật dữ liệu thành công"
        res.redirect('/admin/product/list');
    } catch (error) {
        req.session.error = "Cập nhật dữ liệu không thành công"
        return res.redirect('/admin/product/list');
    }
}

const deleteOne = async (req, res) => {
    try {
        const data = await productModel.findOne({ _id: req.params.id });
        if (!data) return res.status(400).json({
            message: "data does not exist",
            data: []
        })

        await productModel.deleteOne({ _id: req.params.id });
        res.status(200).json({
            message: "deleted successfully"
        });
    } catch (error) {
        res.status(400).send(JSON.stringify(error));
    }
}

const dataIndex = async (req, res) => {
    const topCategories = await productModel.aggregate([
        { $group: { _id: "$cate_id", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
    ]);
    // Logic code to format the result
    const objdata = {};
    const arrKey = [];
    const objCate = {};
      
    for(const category of topCategories) {
        const productsInCategory = await productModel.find({ cate_id: new ObjectId(category._id.toString())}).populate("cate_id").limit(10);
        arrKey.push(productsInCategory[0].cate_id.name)
        objCate[productsInCategory[0].cate_id.name] = category._id.toString();
        objdata[productsInCategory[0].cate_id.name] = productsInCategory
    };
    return { objdata, arrKey, objCate};
}

module.exports = {
    get, 
    get2,
    getby,
    getDetail,
    getDetail2,
    create,
    update, 
    deleteOne,
    dataIndex
}