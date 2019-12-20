const express = require('express')
const app = express();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const morgan = require('morgan');
const User = require('./models/user');
const Plane = require('./models/plane');
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
app.use(morgan('dev'));
app.use(session({ secret: 'ssshhhhh', saveUninitialized: true, resave: true }));

console.log("OK") 
var sess;
var highscores;
mongoose.connect('YOUR_MONGODB_CONNECTION_STRING_HERE')

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
    res.render('selection', { level: sess.maxLevel, plane: sess.maxPlane });
});
app.get('/game', auth, (req, res, next) => {
    sess = req.session;

    Highscore.findOne({ _id: "1" })
        .exec()
        .then(hs => {
        
            Plane.findOne({ _id: 1 })
            .exec()
            .then(pl => {
                let p = sess.plane - 1;
                let name = pl.arr[p].name;
                let info = pl.arr[p].info;
                let pic = pl.arr[p].pic;
                highscores = hs.hs;
                res.render('game', {
                    level: sess.level,
                    lives: sess.lives,
                    score: sess.score,
                    plane: {
                        name: name,
                        info: info,
                        pic: pic
                    },
                    results: highscores
                });
                
            })
            
            
            
        });
});

app.post('/', auth, (req, res, next) => {
    console.log(req.body);
    sess = req.session;
    console.log(req.body);
    if (req.body.level)
        sess.level = parseInt(req.body.level);
    if (req.body.plane)
        sess.plane = parseInt(req.body.plane);

    res.redirect('/game');
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
                        sess.score = 0;
                        sess.plane = 1;
                        sess.lives = 3;
                        sess.maxLevel = user[0].level;
                        sess.maxPlane = user[0].plane;
                        res.cookie("token", token);
                        return res.redirect('/');
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
        sess.score = 0;
        sess.maxLevel = 1;
        sess.lives = 3;
        sess.maxPlane = 1;
        res.cookie("token", "guest");
        return res.redirect('/');
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
    console.log("unlcok-level");
    sess = req.session;
    
    
    console.log(req.body);
    sess.score = req.body.score;
    sess.lives = req.body.lives;
    
    if (sess.level === 10)
        return res.redirect('/unlock-plane');
    if (!sess.username) {
        if (sess.level === sess.maxLevel) {
            sess.maxLevel += 1;
            sess.level += 1;
            res.redirect('/unlock-plane');
        }
        else{
            sess.level += 1;
            res.redirect('/unlock-plane');
        }
    }
    else {
        const user = User.findOne({ username: sess.username })
            .exec()
            .then(user => {
                if (sess.level === user.level) {
                    User.findByIdAndUpdate(user._id, { $set: { level: sess.level + 1 } })
                        .then(user2 => {
                            sess.level += 1;
                            sess.maxLevel += 1;
                            res.redirect('/unlock-plane');
                        });
                }
                else {
                    sess.level += 1;
                    res.redirect('/unlock-plane');
                }
            });
    }


})

app.get('/unlock-plane', (req, res, next) => {
    sess = req.session;
    if (sess.plane === 10)
        return res.redirect('/game');
    if (!sess.username) {
        if (sess.plane === sess.maxPlane) {
            sess.maxPlane += 1;
            sess.plane += 1;
            res.redirect('/game');
        }
        else{
            sess.plane += 1;
            res.redirect('/game');
        }
    }
    else {
        const user = User.findOne({ username: sess.username })
            .exec()
            .then(user => {
                if (user.plane === sess.plane) {
                    User.findByIdAndUpdate(user._id, { $set: { plane: sess.plane + 1 } }, { new: true })
                        .then(user2 => {
                            sess.plane += 1;
                            sess.maxPlane += 1;
                            res.redirect('/game');
                        })
                        .catch(err => {
                            console.log(err);
                        });

                }
                else {
                    sess.plane += 1;
                    res.redirect('/game');
                }
            })
            .catch(err => {
                console.log(err);
            });
    }


});

app.post('/logout', (req, res, next) => {
    console.log(req.body);
    sess = req.session;
    res.clearCookie("token");
    req.session.destroy();
    res.redirect('/login');
});

function compare(a, b) {
  
    let sA = parseInt(a.score);
    let sB = parseInt(b.score);

  let comparison = 0;
  if (sA > sB) {
    comparison = 1;
  } else if (sA < sB) {
    comparison = -1;
  }
  return comparison * -1;
} 
 
app.post('/result', (req, res, next) => {
    sess = req.session;
    sess.score = 0;
    sess.lives = 3;
    console.log("result");
    Highscore.findOne({ _id: 1 })
        .exec()
        .then(hs => {
            let u = "guest";
            if(sess.username)
                u = sess.username;
            hs.hs.push({user: u, score: req.body.score})
            let a = hs.hs;
            console.log(a);
            a.sort(compare);
            if (a >= 11)
                a.pop();
            Highscore.findByIdAndUpdate(1, { $set: { hs: a } })
                .then(result => {
                    
                    res.redirect('/');
                });
        });
});

app.post('/selection', (req, res, next) => {
    sess = req.session;
    res.render('selection', { level: sess.maxLevel, plane: sess.maxPlane });
})
 
 
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
