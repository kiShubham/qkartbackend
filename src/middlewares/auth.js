const passport = require("passport");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");

/**
 * Custom callback function implementation to verify callback from passport
 * - If authentication failed, reject the promise and send back an ApiError object with
 * --- Response status code - "401 Unauthorized"
 * --- Message - "Please authenticate"
 *
 * - If authentication succeeded,
 * --- set the `req.user` property as the user object corresponding to the authenticated token
 * --- resolve the promise
 */

const verifyCallback = (req, resolve, reject) => async (err, user, info) => {
  if (err || info || !user) {
    // If error or no user, authentication failed
    const error = new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate");
    return reject(error);
  }

  // If authentication succeeded, set the user in req.user
  req.user = user;
  resolve(user);
};

/**
 * Auth middleware to authenticate using Passport "jwt" strategy with sessions disabled and a custom callback function
 *
 */

const auth = async (req, res, next) => {
  return new Promise((resolve, reject) => {
    passport.authenticate(
      "jwt", //name should be same
      { session: false },
      verifyCallback(req, resolve, reject)
    )(req, res, next);
  })
    .then(() => next())
    .catch((err) => next(err));
};

module.exports = auth;

/* 

These functions are crucial for handling asynchronous operations using Promises.

resolve(value): This function is used to fulfill a Promise, indicating that the asynchronous operation has successfully completed. 
The value parameter is the value that the Promise will be resolved with. It transitions the Promise's state from pending to fulfilled,
and any attached .then() handlers will be executed with the resolved value.

reject(reason): This function is used to reject a Promise, indicating that the asynchronous operation 
encountered an error or failure. The reason parameter is the reason or error object that explains
why the Promise was rejected. It transitions the Promise's state from pending to rejected,
and any attached .catch() or reject() handlers will be executed with the provided reason.

In  code, using these functions to manage asynchronous operations within the context of authentication.
For example, in your auth middleware, wrapping the passport.authenticate function in a Promise.
If authentication succeeds, you call resolve() to indicate success and 
allow the .then() part of the Promise chain to be executed (move to the next middleware). 
If authentication fails, you call reject(error) to indicate failure and
allow the .catch() part of the Promise chain to be executed (handle the error).

*/
