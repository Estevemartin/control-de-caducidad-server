const mongoose = require('mongoose');
const Schema = mongoose.Schema;

    const userSchema = new Schema({
        firstName: {type: String, required: true},
        surname: {type: String, required: true},
        email: {type: String, required: true, unique: true},
        password: {type: String, required: true},
        companies: [{type: Schema.Types.ObjectId, ref:'Company'}],
        activated: {type:Boolean,default:false},
        token: {
          value: {type:String},
          expiration: {type:Date}
        }
    });

const User = mongoose.model('User', userSchema);

module.exports = User;