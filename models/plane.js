const mongoose = require('mongoose');


const usersSchema = mongoose.Schema({
    _id: Number,
    arr: [{ name: String, info: String, pic: String }]

});

module.exports = mongoose.model('plane', usersSchema);
