const jwt = require('jsonwebtoken')

module.exports = (req, res, next) => {
    try {
        //verify the jwt token supplied by user in the header authorization of the request
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        //we can use the decoded version of the token for future requests of the user
        req.userData = decoded;
        //user next() to resume the process of forwarding the user to the real route that he wants
        next();
    } catch(error){
        return res.status(401).json({
            message: 'Auth failed'
        });
    }
};
