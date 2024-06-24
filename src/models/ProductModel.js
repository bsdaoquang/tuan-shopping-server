const { Schema, default: mongoose } = require("mongoose");

const ProductScheme = new Schema({
  title: {
    require: true,
    type: String
  },
  description: String,
  price: Number,
  rate: Number,
  sizes: [String],
  likedBys: [String],
  quantity: Number,
  img:{
    require: true,
    type: String
  },
  created: {
    type: Date,
    default: Date.now()
  },
  updatedAt: {
    type: Date,
    default: Date.now()
  }
})

const ProductModel = mongoose.model('products', ProductScheme)
module.exports = ProductModel