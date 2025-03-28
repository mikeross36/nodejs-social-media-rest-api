import { body, param } from "express-validator";
import { hadndleValidationErrors } from "../middlewares/handleValidationErrors";

export const validateRegisterUserRequest = [
  body("userName").notEmpty().withMessage("User name is required"),
  body("email").isEmail().withMessage("Invalid email"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 6 characters"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Password confirmation does not match password");
    }
    return true;
  }),
  hadndleValidationErrors,
];

export const validateLoginUserRequest = [
  body("email").isEmail().withMessage("Invalid email"),
  body("password").notEmpty().withMessage("Password is required"),
  hadndleValidationErrors,
];

export const validateChangePasswordRequest = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters"),
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Password confirmation does not match new password");
    }
    return true;
  }),
  hadndleValidationErrors,
];

export const validateUserId = [
  param("id")
    .notEmpty()
    .withMessage("User id is required")
    .isMongoId()
    .withMessage("Invalid user id format"),
];
