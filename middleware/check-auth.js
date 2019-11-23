const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (token === "guest") {
            next();
            return;
        }
        const decode = jwt.verify(token, "secret");
        req.userData = decode;
        next();
    } catch {
        console.log("CHECK AUTH ERROR")
        return res.redirect('/login')
    }
}