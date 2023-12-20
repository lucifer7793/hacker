const express = require("express");
require('dotenv').config();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require("path")
const session = require('express-session');
const routeAPI = require("./modules/routes/index");
const CategoryController = require("./modules/category/category.controller");
const UserController = require("./modules/users/user.controller");
const ProductController = require("./modules/products/products.controller");
const { populate_admin } = require("./modules/common");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const userModel = require("./modules/users/user.model");

const server = express();

const strConnection = process.env.connection_str || 'mongodb://localhost222:27017/clone-eco?authSource=admin';

mongoose.connect(strConnection, { useNewUrlParser: true, useUnifiedTopology: true });


server.use(bodyParser.json());
server.use(bodyParser.urlencoded({
    extended: true
}));
server.use(cookieParser());

server.use(session({
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  secret: 'shhhh, very secret'
}));

function authenticateToken(req, res, next) {
  const token = req.cookies['access_token'];
  if (!token) {
    req.session.error = 'Bạn không có quyền truy cập!'
    return res.redirect('/admin/login');
  }

  jwt.verify(token, '123123', (err, user) => {
    if (err) return res.redirect('/admin/login');
    res.locals.user = user
    next();
  });
}

async function authenUser(req, res, next) {
  const user_id = req.cookies['user_id'];

  res.locals.username = null;
  res.locals.points = null;

  if(user_id) {
    const user = await userModel.findOne({_id: user_id})
    if(user) {
      res.locals.points = user.points;
      res.locals.username = user.name;
      
    }
  }
  
  
  next();  
}

server.use("/api/admin/login", UserController.admin_login);
server.use("/api/register", UserController.register);
server.use("/api/login", UserController.login);

server.use("/api/admin/logout", (req, res) => {
  res.clearCookie('access_token');
  res.redirect("/admin/login")
})
  

server.use("/api", authenticateToken, routeAPI);


server.set("view engine", "ejs");
server.use(express.static(__dirname + '/public'));
server.use(express.static(__dirname + '/uploads'));

// server.use('/uploads', express.static('uploads'));


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Handle image uploads
server.post('/upload-image', upload.single('file'), (req, res) => {
  const imagePath = `/${req.file.filename}`;
  res.json({ location: imagePath });
});

// Session-persisted message middleware

server.use(function(req, res, next){
  var err = req.session.error;
  var msg = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.locals.message = '';
  if (err) { 
    // res.locals.status = false;
    res.locals.message = `<div class="alert" style="background-color: red;"><span class="closebtn" onclick="this.parentElement.style.display='none';">&times;</span>`+err+`</div>`;
  }
  if (msg) {
    res.locals.message = `<div class="alert" style="background-color: green;"><span class="closebtn" onclick="this.parentElement.style.display='none';">&times;</span>`+msg+`</div>`;
  }
  next();
});

server.get("/", authenUser, async (req, res, next) => {
  
  const { objdata, arrKey, objCate } = await ProductController.dataIndex();
  res.render("index", {
    cate: await CategoryController.getAll(13),
    objdata,
    arrKey,
    objCate,
    formatMoney
  });
});

server.get("/list/", authenUser, async (req, res, next) => {
  const result = await ProductController.getby(req);
  const totalPage = Math.ceil(result.meta.total / result.meta.limit);
  
  const pagination = getPaginationButtons(result.meta.limit, result.meta.page, totalPage)

  res.render("list", {
    data: result,
    pagination,
    curPage: result.meta.page,
    totalPage,
    cate_id: req.query.cate_id,
    formatMoney
  }); 
});

server.get("/detail", authenUser, async (req, res, next) => {
  const result = await ProductController.getDetail2(req)
  if(!result.success) {
    return res.render("/")
  }

  res.render("detail", {
    message: result.success ? null : result.message,
    data: result.data,
    category: await CategoryController.getAll(),
    formatMoney
  });

  // res.render("detail")

});

server.get("/login", (req, res, next) => {
  const user_id = req.cookies['user_id'];
  if(user_id) return res.redirect("/");

  res.render("login");
});

server.get("/register", (req, res, next) => {
  const user_id = req.cookies['user_id'];
  if(user_id) return res.redirect("/");

  res.render("register");
});

server.get("/signout", (req, res, next) => {
  res.clearCookie('user_id');

  res.redirect("/");
});

// admin
server.get("/admin/login", (req, res, next) => {
  if (req.cookies['access_token']) {
    return res.redirect("/admin");
  }
  res.render("admin/login");
});

server.get("/admin/change-password", authenticateToken, (req, res, next) => {
  res.render("admin/change-password");
});

server.get("/admin", authenticateToken, (req, res, next) => {
  res.render("admin/index");
});

server.get("/admin/category/create", authenticateToken, (req, res, next) => {
  res.render("admin/category/create"); 
});

server.get("/admin/category/list", authenticateToken, async (req, res, next) => {
  const result = await CategoryController.get2(req);
  const totalPage = Math.ceil(result.meta.total / result.meta.limit);
  
  const pagination = getPaginationButtons(result.meta.limit, result.meta.page, totalPage)

  res.render("admin/category/table", {
    data: result,
    pagination,
    curPage: result.meta.page,
    totalPage
  }); 
});

server.get("/admin/category/edit/:id", authenticateToken, async (req, res, next) => {
  const result = await CategoryController.getDetail2(req)
  
  res.render("admin/category/edit", {
    message: result.success ? null : result.message,
    data: result.data
  }); 
});

// admin user
server.get("/admin/user/create", authenticateToken, (req, res, next) => {
  res.render("admin/users/create"); 
});

server.get("/admin/user/list", authenticateToken, async (req, res, next) => {
  req.user = res.locals.user
  const result = await UserController.get2(req);
  const totalPage = Math.ceil(result.meta.total / result.meta.limit);
  
  const pagination = getPaginationButtons(result.meta.limit, result.meta.page, totalPage)

  res.render("admin/users/table", {
    data: result,
    pagination,
    curPage: result.meta.page,
    totalPage
  }); 
});

server.get("/admin/user/edit/:id", authenticateToken, async (req, res, next) => {
  const result = await UserController.getDetail2(req);

  if(!result.success) {
    req.session.error = 'Dữ liệu không tồn tại'
    return res.render("admin/users/table")
  }
  
  res.render("admin/users/edit", {
    message: result.success ? null : result.message,
    data: result.data
  }); 
});

// admin product
server.get("/admin/product/create", authenticateToken, async (req, res, next) => {
  
  res.render("admin/product/create", {
    category: await CategoryController.getAll()
  }); 
});

server.get("/admin/product/list", authenticateToken, async (req, res, next) => {

  const result = await ProductController.get2(req);
  const totalPage = Math.ceil(result.meta.total / result.meta.limit);
  
  const pagination = getPaginationButtons(result.meta.limit, result.meta.page, totalPage)

  res.render("admin/product/table", {
    data: result,
    pagination,
    curPage: result.meta.page,
    totalPage
  }); 
});

server.get("/admin/product/edit/:id", authenticateToken, async (req, res, next) => {
  const result = await ProductController.getDetail2(req)
  if(!result.success) {
    req.session.error = 'Dữ liệu không tồn tại'
    return res.render("admin/product/table")
  }


  res.render("admin/product/edit", {
    message: result.success ? null : result.message,
    data: result.data,
    category: await CategoryController.getAll()
  }); 
});


populate_admin();

function getPaginationButtons(limit, currentPage, totalPages) {
  const buttons = [];

  // Calculate starting and ending page numbers for the button display
  let startPage = 1;
  let endPage = totalPages;

  // Show 3 pages before and after the current page
  if (totalPages > 3) {
    startPage = currentPage - Math.min(currentPage - 1, 2);
    endPage = currentPage + Math.min(totalPages - currentPage, 2);
  }

  // Ensure start and end page stay within bounds
  startPage = Math.max(1, startPage);
  endPage = Math.min(totalPages, endPage);

  // Add page numbers to the buttons array
  for (let i = startPage; i <= endPage; i++) {
    buttons.push(i);
  }

  return buttons;
}

function formatMoney(amount) {
  // Convert amount to string
  const amountString = amount.toString();

  // Add thousands separator
  const parts = amountString.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  // Add decimal and format with two decimal places
  return parts.join('.');
}


server.listen(9000, console.log("running port 9000"));