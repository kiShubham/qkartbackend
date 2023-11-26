const mongoose = require("mongoose");
const { productSchema } = require("./product.model");
const config = require("../config/config");
const { string } = require("joi");
const { number } = require("joi");

// TODO: CRIO_TASK_MODULE_CART - Complete cartSchema, a Mongoose schema for "carts" collection

const cartItemsSchema = new mongoose.Schema({
  product: productSchema,
  quantity: { type: Number, default: 1 },
});
const cartSchema = new mongoose.Schema(
  {
    paymentOption: {
      type: String,
      default: config.default_payment_option,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    cartItems: [cartItemsSchema],
  },
  {
    timestamps: false,
  }
);

/**
 * @typedef Cart
 */
const Cart = mongoose.model("Cart", cartSchema);

module.exports.Cart = Cart;
