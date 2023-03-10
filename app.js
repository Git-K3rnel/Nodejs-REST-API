const express = require("express");
const app = express();
//morgan shows logs on the terminal
const morgan = require("morgan");
//body-parser parses json data and urlencoded data of the POST requests
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require('cors');

//Handling CORS headers
// app.use((req, res, next)=>{
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
//     if(req.method === "OPTIONS"){
//         res.header("Access-Control-Allow-Methods", "PUT, POST, PATH, DELETE, GET");
//         return res.status(200).json({});
//     }
//     next(error);
// });

//Handling CORS headers
app.use(cors({
        origin: "*",
        methods: ['GET','POST','DELETE','UPDATE','PUT','PATCH']
    })
);

const productRoutes = require("./api/routes/products")
const ordersRoutes = require("./api/routes/orders")
const userRoutes = require("./api/routes/user")


//connect to database
mongoose.connect(
    "YOUR_MONGODB_CONNECT_ADDRESS"
);

app.use(morgan("dev"));
//make the upload folder available to everyone
//like : http:/uploads/localhost:3000/2023-03-07T13-28-07.208ZAnonymous%202.jpg
app.use('/uploads', express.static('uploads'));
//set body-parser to accept urlencode and json
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
//routes that handle requests
app.use("/products", productRoutes);
app.use("/orders", ordersRoutes);
app.use("/user", userRoutes);


//handles errors that has no route for
app.use((req, res, next)=>{
    const error = new Error("Not found");
    error.status = 404;
    next(error);
});

//handles all other errors like database errors
app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});


module.exports = app;
