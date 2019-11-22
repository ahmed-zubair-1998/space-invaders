const mongoose = require('mongoose');


const highscoreSchema = mongoose.Schema({
    _id: Number,
    score: [Number]
}); 

module.exports = mongoose.model('Highscores', highscoreSchema);
 