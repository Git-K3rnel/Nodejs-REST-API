const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
//bcrypt helps hashing the passwords when saving to the database
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const checkAuth = require("../middleware/check-auth");

const User = require('../models/user')

router.get('/', (req, res, next) =>{
    User.find()
    .exec()
    .then(result => {
        res.status(200).json({
            count: result.length,
            orders: result.map((doc) => {
                return {
                    _id: doc._id,
                    email: doc.email,
                };
            }),
        });
    })
    .catch(err => {
        res.status(500).json({
            error: err
        });
    })
})


router.post('/signup', (req, res, next) =>{
    //check if the email is unique in the database
    User.find({email: req.body.email})
    .exec()
    .then(user => {
        if(user.length >= 1){
            return res.status(409).json({
                message: 'Email already exists'
            })
        } else {
            bcrypt.hash(req.body.password, 10, (err, hash) => {
                if (err) {
                    return res.status(500).json({
                        error: err,
                    });
                } else {
                    const user = new User({
                        _id: new mongoose.Types.ObjectId(),
                        email: req.body.email,
                        password: hash,
                    });
                    user.save()
                    .then((result) => {
                        console.log(result);
                        res.status(201).json({
                            message: "User created",
                        });
                    })
                    .catch((err) => {
                        console.log(err);
                        res.status(500).json({
                            error: err,
                        });
                    });
                }
            }); 
        }
    })
});


router.post('/login', (req, res, next) =>{
    //find user in the database based on email address
    User.find({email: req.body.email})
    .exec()
    .then(user => {
        if(user.length < 1){
            return res.status(401).json({
                message: 'Authentication failed'
            });
        }
        //compare user supplied password with password field of user array
        bcrypt.compare(req.body.password, user[0].password, (err, result) =>{
            if (err) {
                return res.status(401).json({
                    message: "Authentication failed",
                });
            }
            if (result) {
                //building jwt token
                const token = jwt.sign({
                    //payload of the jwt
                    email: user[0].email,
                    userId: user[0]._id
                },
                //the secret key of th jwt
                process.env.JWT_KEY,
                //options of the signing process
                {
                    expiresIn:"1h"
                },

                );
                return res.status(200).json({
                    message: "Authentication successful",
                    token: token
                });
            }
            res.status(401).json({
                message: "Authentication failed"
            });
        })
    })
    .catch(err =>{
        console.log(err);
        res.status(500).json({
            error: err
        });
    });
});


router.delete('/:userID', checkAuth, (req, res, next) =>{
    User.deleteOne({_id: req.params.userID})
    .exec()
    .then(result => {
        res.status(200).json({
            message: "User deleted",
        });
    })
    .catch(err =>{
        console.log(err);
        res.status(500).json({
            error: err
        })
    })
});
module.exports = router;