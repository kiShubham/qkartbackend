const httpStatus = require("http-status");
const { Cart, Product } = require("../models");
const ApiError = require("../utils/ApiError");
const config = require("../config/config");

//DONE TODO: CRIO_TASK_MODULE_CART - Implement the Cart service methods

/**
 * Fetches cart for a user
 * - Fetch user's cart from Mongo
 * - If cart doesn't exist, throw ApiError
 * --- status code  - 404 NOT FOUND
 * --- message - "User does not have a cart"
 *
 * @param {User} user
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const getCartByUser = async (user) => {
  const userCart = await Cart.findOne({ email: user.email });
  if (!userCart) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart");
  }
  return userCart;
};

/**
 * Adds a new product to cart
 * - Get user's cart object using "Cart" model's findOne() method
 * --- If it doesn't exist, create one
 * --- If cart creation fails, throw ApiError with "500 Internal Server Error" status code
 *
 * - If product to add already in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product already in cart. Use the cart sidebar to update or remove product from cart"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - Otherwise, add product to user's cart
 *
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const createNewCart = async (user) => {
  const data = {
    email: user.email,
    cartItems: [],
    paymentOption: config.default_payment_option,
  };
  const document = await Cart.create(data);
  return document;
  // const document = new Cart(data); // on server
  // return await document.save(); // in db
};

const addProductToCart = async (user, productId, quantity) => {
  //check product in db
  const getProduct = await Product.findById(productId);
  if (!getProduct) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product doesn't exist in database"
    );
  }
  // user's Cart
  let userCart = await Cart.findOne({ email: user.email });
  if (!userCart) {
    //create new cart
    userCart = await createNewCart(user);
    if (!userCart) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  //checking product doesnt exist ;
  const ProductAlreadyExist = userCart.cartItems.find((item) =>
    item.product._id.equals(productId)
  );
  if (ProductAlreadyExist) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product already in cart. Use the cart sidebar to update or remove product from cart"
    );
  }

  userCart.cartItems.push({ product: getProduct, quantity: quantity });

  await userCart.save();
  return userCart;
};

/**
 * Updates the quantity of an already existing product in cart
 * - Get user's cart object using "Cart" model's findOne() method
 * - If cart doesn't exist, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart. Use POST to create cart and add a product"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * - Otherwise, update the product's quantity in user's cart to the new quantity provided and return the cart object
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const updateProductInCart = async (user, productId, quantity) => {
  //get users cart
  const userCart = await Cart.findOne({ email: user.email });
  if (!userCart) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User does not have a cart. Use POST to create cart and add a product"
    );
  }

  const isProductInDb = await Product.findById(productId);
  if (!isProductInDb) {
    // does bool works for string ;yes it does ;
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Product doesn't exist in database"
    );
  }

  //Since Array.prototype.find() is a synchronous operation and doesn't involve any asynchronous behavior, you don't actually need to use await with it.
  const isProductExist = userCart.cartItems.find((item) =>
    item.product._id.equals(productId)
  );
  if (!isProductExist) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Product not in cart");
  }

  //if the product exist in cart then ,update the product's quantity
  isProductExist.quantity = quantity;
  await userCart.save();
  return userCart;
};

/**
 * Deletes an already existing product in cart
 * - If cart doesn't exist for user, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * Otherwise, remove the product from user's cart
 *
 *
 * @param {User} user
 * @param {string} productId
 * @throws {ApiError}
 */
const deleteProductFromCart = async (user, productId) => {
  const userCart = await Cart.findOne({ email: user.email });
  if (!userCart) {
    throw new ApiError(httpStatus.BAD_REQUEST, "User does not have a cart");
  }

  const productInCart = userCart.cartItems.find((item) =>
    item.product._id.equals(productId)
  );
  if (!productInCart) {
    throw new ApiError(httpStatus.BAD_REQUEST, "product not in cart");
  }
  let idx = userCart.cartItems.indexOf(productInCart);
  userCart.cartItems.splice(idx, 1);
  await userCart.save();
  return;
};

// TODO: CRIO_TASK_MODULE_TEST - Implement checkout function
/**
 * Checkout a users cart.
 * On success, users cart must have no products.
 *
 * @param {User} user
 * @returns {Promise}
 * @throws {ApiError} when cart is invalid
 */
const checkout = async (user) => {
  const cart = await Cart.findOne({ email: user.email });

  if (!cart) {
    throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart");
  }

  const { cartItems } = cart;
  if (cartItems.length == 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "empty Cart"); //empty cart
  }

  if (!user.hasSetNonDefaultAddress()|| user.address === config.default_address) {
    throw new ApiError(httpStatus.BAD_REQUEST, "address not set");
  }

  let totalCost = 0;
  for (let i = 0; i < cartItems.length; i++) {
    totalCost += cartItems[i].product.cost * cartItems[i].quantity;
  }
  if (totalCost > user.walletMoney) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "wallet balance is insufficient"
    ); //empty cart
  }
  const net = user.walletMoney - totalCost;
  cart.cartItems = []; // emptying the cart
  user.walletMoney = net;
  // await user.save(); // saving wallet balance , we dont need this save , as it saving by above statement ;
  await cart.save();
  return;
};

module.exports = {
  getCartByUser,
  addProductToCart,
  updateProductInCart,
  deleteProductFromCart,
  checkout,
};
