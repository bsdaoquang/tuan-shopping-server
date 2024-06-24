const { Router } = require("express");
const { getProducts, addProduct, removeProduct } = require("../controllers/productController");

const productRouter = Router()

productRouter.get('/all', getProducts)
productRouter.post('/add', addProduct)
productRouter.delete('/remove', removeProduct)

module.exports = productRouter