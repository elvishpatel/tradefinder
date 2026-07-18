import { body } from 'express-validator';

export const registerValidator = [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('email').isEmail().withMessage('Please include a valid email').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
];

export const loginValidator = [
  body('email').isEmail().withMessage('Please include a valid email').normalizeEmail(),
  body('password').exists().withMessage('Password is required'),
];
