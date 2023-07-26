const express = require('express');
const { celebrate, Segments, Joi } = require('celebrate');

const router = express.Router();
const user = require('../controllers/users');

router.get('/users/me', user.getUser);

router.patch(
  '/users/me',
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      name: Joi.string().min(2).max(30).required(),
      email: Joi.string().email().required(),
    }),
  }),
  user.updateUser,
);

module.exports = router;
