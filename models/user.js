const mongoose = require('mongoose');


const usersSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    level: { type: Number, default: 1},
    plane: { type: Number, default: 1}
}); 

module.exports = mongoose.model('Users', usersSchema);
 