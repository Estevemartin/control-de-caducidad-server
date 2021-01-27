const mongoose = require('mongoose');
const Schema = mongoose.Schema;

    const companySchema = new Schema({
        companyName: {type: String, required: true},
        logoUrl: {type: String},
        invitationCode: {type: String, unique: true},
        password: {type: String, /* required: true */},
        items: [{type: Schema.Types.ObjectId, ref:'Item'}],
        workers: [{type: Schema.Types.ObjectId, ref:'Worker'}],
        deliveries: [{type: Schema.Types.ObjectId, ref:'Delivery'}],
        responsible: {
          respName: {type:String},
          email: {type:String}
        }
    });

const Company = mongoose.model('Company', companySchema);

module.exports = Company;