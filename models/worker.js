const mongoose = require('mongoose');
const Schema = mongoose.Schema;

    const workerSchema = new Schema({
        name: {type: String, required: true},
        surname: {type: String, required: true},
        email: {type: String},
        items: [{type: Schema.Types.ObjectId, ref:'Item'}],
        deliveries: [{type: Schema.Types.ObjectId, ref:'Delivery'}],
    });

const Worker = mongoose.model('Worker', workerSchema);

module.exports = Worker;