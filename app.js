const express = require('express')
const app = express();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const User = require('./models/user');
const Highscore = require('./models/highscore');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const auth = require('./middleware/check-auth');

app.use('/static', express.static('public'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(session({ secret: 'ssshhhhh', saveUninitialized: true, resave: true }));

var sess;
var highscores;
mongoose.connect('mongodb+srv://ahmed:zubair@cluster0-qdtb8.mongodb.net/test?retryWrites=true&w=majority')

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "origin, X-Requested-With, Content-Type, Accept, Autherization");
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "*");
        return res.status(200).json({});
    }
    next();
});


app.get('/', auth, (req, res, next) => {
    sess = req.session;

    Highscore.findOne({ _id: 1 })
        .exec()
        .then(hs => {
            highscores = hs.score;
            console.log("High scores: " + hs.score);
            res.render('index', {
                level: sess.level,
                plane: sess.plane,
                score: hs.score
            });
        });


});

app.post('/', auth, (req, res, next) => {
    sess = req.session;
    console.log(req.body);
    if (req.body.level)
        sess.level = parseInt(req.body.level);
    if (req.body.plane)
        sess.plane = parseInt(req.body.plane);

    res.redirect('/');
});

app.get('/login', (req, res, next) => {
    res.render('login');
});

app.get('/signup', (req, res, next) => {
    res.render('signup', { label: '' });
});

app.post('/signup', (req, res, next) => {
    if (req.body.password != req.body.confirm) {
        return res.render('signup', { label: "Passwords don't match" });
    }
    User.find({ username: req.body.username })
        .exec()
        .then(user => {
            if (user.length === 0) {
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    if (err) {
                        res.render('signup', { label: err });
                    }
                    else {
                        const user = new User({
                            _id: new mongoose.Types.ObjectId(),
                            username: req.body.username,
                            password: hash
                        });
                        user.save()
                            .then(result => {
                                res.redirect('/login');
                            })
                            .catch(err => {
                                return res.render('signup', { label: err });
                            });
                    }
                });
            } else {
                res.render('signup', { label: 'Username exists' });
            }
        })
})

app.post('/login', (req, res, next) => {
    if (req.body.username) {
        const user = User.find({ username: req.body.username })
            .exec()
            .then(user => {
                if (user.length === 0) {
                    return res.render('login', { label: "Auth failed" });
                }
                bcrypt.compare(req.body.password, user[0].password, (err, result) => {
                    if (err) {
                        return res.render('login', { label: "Auth failed" });
                    }
                    if (result) {
                        const token = jwt.sign(
                            {
                                username: user[0].username,
                                id: user[0]._id
                            },
                            "secret",
                            {
                                expiresIn: "1h"
                            }
                        );
                        sess = req.session;
                        sess.username = user[0].username;
                        sess.level = 1;
                        sess.plane = 1;
                        res.cookie("token", token);
                        return res.render('game', { results: highscores });
                    }
                    return res.render('login', { label: "Auth failed" });
                });
            })
            .catch(err => {
                return res.render('login', { label: "Auth failed" });
            });
    } else {
        sess = req.session;
        sess.level = 1;
        sess.plane = 1;
        sess.maxLevel = 1;
        sess.maxPlane = 1;
        res.cookie("token", "guest");
        return res.render('game', { results: highscores });
    }
});

app.post('/plane', (req, res, next) => {
    sess = req.session;
    if (!sess.username) {
        return res.render('plane', { unlocked: sess.maxPlane });
    }
    const user = User.findOne({ username: sess.username })
        .exec()
        .then(user => {
            let plane = user.plane;
            return res.render('plane', { unlocked: plane });
        });

});

app.post('/level', (req, res, next) => {
    sess = req.session;
    if (!sess.username) {
        return res.render('level', { unlocked: sess.maxLevel });
    }
    const user = User.findOne({ username: sess.username })
        .exec()
        .then(user => {
            let level = user.level;
            return res.render('level', { unlocked: level });
        });

});

app.post('/unlock-level', (req, res, next) => {
    sess = req.session;
    if (sess.level === 10)
        return res.redirect('/');
    if (!sess.username) {
        if (sess.level === sess.maxLevel) {
            sess.maxLevel += 1;
            sess.level += 1;
        }
        res.redirect('/');
    }
    else {
        const user = User.findOne({ username: sess.username })
            .exec()
            .then(user => {
                if (sess.level === user.level) {
                    User.findByIdAndUpdate(user._id, { $set: { level: sess.level + 1 } })
                        .then(user2 => {
                            sess.level += 1;
                            res.redirect('/');
                        });
                }
                else {
                    res.redirect('/');
                }
            });
    }


})

app.post('/unlock-plane', (req, res, next) => {
    sess = req.session;
    if (sess.plane === 10)
        return res.redirect('/');
    if (!sess.username) {
        if (sess.plane === sess.maxPlane) {
            sess.maxPlane += 1;
            sess.plane += 1;
        }
        res.redirect('/');
    }
    else {
        const user = User.findOne({ username: sess.username })
            .exec()
            .then(user => {
                if (user.plane === sess.plane) {
                    User.findByIdAndUpdate(user._id, { $set: { plane: sess.plane + 1 } }, { new: true })
                        .then(user2 => {
                            sess.plane += 1;
                            res.redirect('/');
                        })
                        .catch(err => {
                            console.log(err);
                        });

                }
                else {
                    res.redirect('/');
                }
            })
            .catch(err => {
                console.log(err);
            });
    }


});

app.post('/logout', (req, res, next) => {
    sess = req.session;
    res.clearCookie("token");
    req.session.destroy();
    res.redirect('/login');
});

app.post('/result', (req, res, next) => {
    Highscore.findOne({ _id: 1 })
        .exec()
        .then(hs => {
            console.log(hs);
            console.log(req.body.num);
            hs.score.push(req.body.num);
            let a = hs.score;
            a = a.map(Number);
            a.sort((x, y) => x - y);
            a.reverse();
            if (a >= 6)
                a.pop();
            console.log("asss", a);
            Highscore.findByIdAndUpdate(1, { $set: { score: a } })
                .then(result => {
                    res.redirect('/');
                });
        });
});



app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 400;
    next(err);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500).json({
        error: {
            message: error.message
        }
    });
});

module.exports = app;