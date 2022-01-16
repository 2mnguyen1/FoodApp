const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const Product = require('./models/product')
const methodOverride = require('method-override')
const AppError = require('./AppError');

mongoose.connect('mongodb://localhost:27017/farmStand')
    .then(() => {
        console.log('connected to db');
    })
    .catch(err => {
        console.log('fail to db');
        console.log(err);
    })

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

const categories = ['fruit', 'vegetable', 'dairy', 'fungi'];

function wrapAsync(fn) {
    return function (req, res, next) {
        fn(req, res, next).catch(e => next(e));
    }
}
// display all products
app.get('/products', wrapAsync(async (req, res, next) => {
    const { category } = req.query;
    if (category) {
        const products = await Product.find({ category });
        res.render('products/index', { products, category });
    } else {
        const products = await Product.find({});
        res.render('products/index', { products, category: 'ALL' });
    }
}))
// create new product
app.get('/products/new', (req, res) => {
    res.render('products/new', { categories });
})
app.post('/products', wrapAsync(async (req, res, next) => {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.redirect(`/products/${newProduct._id}`);
}))

// show one
app.get('/products/:id', wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    const foundProduct = await Product.findById(id);
    if (!foundProduct) {
        throw new AppError('Product Not Found', 404);
    }
    res.render('products/show', { foundProduct })
}))
// edit

app.get('/products/:id/edit', wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    const foundProduct = await Product.findById(id);
    if (!foundProduct) {
        throw new AppError('Product Not Found', 404);
    }
    res.render('products/edit', { foundProduct, categories })
}))
app.put('/products/:id', wrapAsync(async (req, res, next) => {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, req.body, { runValidators: true, new: true });
    res.redirect(`/products/${product._id}`);
}))

// deleting 
app.delete('/products/:id', wrapAsync(async (req, res) => {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);
    res.redirect('/products');
}))

app.get('*', (req, res) => {
    res.render('products/error');
})

const handleValidationError = err => {
    return new AppError('Validation Fail ' + err.message, 400);
}

app.use( (err, req, res, next) => {
    if (err.name === 'ValidationError') err = handleValidationError(err);
    next(err);
})


app.use((err, req, res, next) => {
    const { status = 500, message = 'Something went wrong' } = err;
    res.status(status).send(message);
})

app.listen(3000, () => {
    console.log('3000 PORT');
})

// products?category=dairy