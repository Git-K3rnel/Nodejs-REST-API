const express = require('express')
const router = express.Router();
const mongoose = require('mongoose');
//multer can handle form data both binary for file upload and json
const multer = require('multer');
//we use this handler to add to any route that we want to protect
const checkAuth = require('../middleware/check-auth');

//specify how files are going to be stored
const storage = multer.diskStorage({
    destination: function(req, file, callback){
        callback(null, './uploads/');
    },
    filename: function(req, file, callback){
        callback(null, new Date().toISOString().replace(/:/g, '-') + file.originalname);
    }
});

const fileFilter = (req, file, callback) => {
    //reject a file
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png"){
        callback(null, true);
    } else {
        callback(null, false);
    }
};
//use the specified features in multer handler
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5,
    },
    fileFilter: fileFilter
});

const Product = require('../models/product');

router.get('/', (req, res, next)=>{
    Product.find()
    //only select these fields from database
    .select('name price _id productImage')
    .exec()
    .then(docs => {
        const response = {
            count: docs.length,
            //adding some metadata to the response (optional)
            products: docs.map(doc => {
                return {
                    name: doc.name,
                    price: doc.price,
                    productImage: doc.productImage,
                    _id: doc._id,
                    request: {
                        type: 'GET',
                        url: 'http://localhost:3000/products/'+ doc._id
                    }
                }
            })
        }
        res.status(200).json(response);
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
});

router.post("/", checkAuth, upload.single('productImage'), (req, res, next) => {
    const product = new Product({
        _id: new mongoose.Types.ObjectId(),
        name: req.body.name,
        price: req.body.price,
        productImage: req.file.path
    });
    //store in the database wtih save()
    product
    .save()
    .then(result =>{
        console.log(result);
        res.status(201).json({
            message: "Created product successfully",
            createdProduct: {
                name: result.name,
                price: result.price,
                _id: result._id,
                request: {
                    type: 'GET',
                    url: 'http://localhost:3000/products/' + result._id
                }
            }
        });
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({
            error: err
        })
    });
});

router.get('/:productID', (req, res, next)=>{
    const id = req.params.productID;
    Product.findById(id)
    .select('name price _id productImage')
    .exec()
    .then(doc => {
        console.log("From database", doc);
        if(doc){
            res.status(200).json({
                product: doc,
                request: {
                    type: 'GET',
                    description: 'GET_ALL_PRODUCTS',
                    url: 'http://localhost:3000/products'
                }
            });
        } else{
            res.status(404).json({message: "No valid entry found for provided ID"});
        }
    })
    .catch(err => {
        console.log(err);
        res.status(500).json({error: err})
    });
});

router.patch("/:productID", checkAuth, (req, res, next) => {
    const id = req.params.productID;
    const updateOps = {};
    for (const ops of req.body){
        updateOps[ops.propName] = ops.value;
    }
    Product.updateOne({ _id: id }, {$set: updateOps})
    .exec()
    .then(result => {
        console.log(result);
        res.status(200).json({
            message: "Product updated",
            request: {
                type: "GET",
                url: "http://localhost:3000/products/" + id,
            },
        });
    })
    .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});
// send patch request like this :
// [
//     {"propName": "name",
//     "value": "New Harry Potter"}
// ]


router.delete("/:productID", checkAuth, (req, res, next) => {
    const id = req.params.productID;
    Product.deleteOne({_id: id})
        .exec()
        .then(result => {
            res.status(200).json({
                message: "Product deleted",
            });
        })
        .catch(err => {
            console.log(err);
            res.status(500).json({
                error: err
            });
        });
});


module.exports = router