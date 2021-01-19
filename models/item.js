const mongoose = require('mongoose');
const Schema = mongoose.Schema;

    const itemSchema = new Schema({
        name: {type: String, required: true},
        validity: {
          number: {type:Number, required:true},
          units: {type:String, required:true}
        },
        responsible: {
          name: {type:String},
          email: {type:String}
        },
        workers: [{type: Schema.Types.ObjectId, ref:'Worker'}],
        deliveries: [{type: Schema.Types.ObjectId, ref:'Delivery'}],
        reminders: [{
          emailBody: {type:String},
          timeInAdvance: {
            number: {type:Number, required:true},
            units: {type:String, required:true}
          },
          recipients: [{type: String}],
        }],
        reports:[{
          frequency: {
            number: {type:Number, required:true},
            units: {type:String, required:true}
          },
          period: {
            number: {type:Number, required:true},
            units: {type:String, required:true}
          },
          recipients: [{type: String}]
        }]
    });

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;