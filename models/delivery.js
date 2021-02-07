const mongoose = require('mongoose');
const Schema = mongoose.Schema;

    const deliverySchema = new Schema({
        deliveryName: {type: String},
        deliveryDate: {type: Date, required: true},
        expirationDate: {type: Date, required: true},
        items: {type: Schema.Types.ObjectId, ref:'Item', required: true},
        workers: [{type: Schema.Types.ObjectId, ref:'Worker', required: true}],
    });

const Delivery = mongoose.model('Delivery', deliverySchema);

module.exports = Delivery;