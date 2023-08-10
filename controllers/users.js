/* eslint-disable consistent-return */
const bcrypt = require('bcrypt');
const jsonWebToken = require('jsonwebtoken');
const User = require('../models/user');
const WrongId = require('../middlewares/WrongIdError');
const WrongData = require('../middlewares/WrongDataError');
const SameUserError = require('../middlewares/SameUserError');
const Unauthorized = require('../middlewares/UnauthorizedError');

exports.getUser = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      next(new WrongId('Пользователь по указанному _id не найден.'));
      return;
    }
    res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { name, email } = req.body;

    const existingUser = await User.findOne({ email, _id: { $ne: userId } });

    if (existingUser) {
      return next(new WrongData('Пользователь с таким email уже существует.'));
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true, runValidators: true },
    );

    if (!updatedUser) {
      return next(new WrongId('Пользователь по указанному _id не найден.'));
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    if (error.name === 'CastError') {
      next(new WrongData('Переданы некорректные данные пользователя.'));
    } else {
      next(error);
    }
  }
};

exports.createUser = async (req, res, next) => {
  try {
    const { name, password, email } = req.body;
    const hashedPassword = await bcrypt.hash(String(password), 12);
    const user = new User({
      name,
      password: hashedPassword,
      email,
    });
    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (error) {
    if (error.code === 11000 && error.keyPattern) {
      if (error.keyPattern.email === 1) {
        next(new SameUserError('Пользователь с таким email уже существует.'));
      }
    } else if (error.name === 'ValidationError') {
      next(new WrongData('Переданы некорректные данные пользователя.'));
    } else {
      next(error);
    }
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      next(new Unauthorized('Пользователь с указанным email не найден.'));
      return;
    }
    const isValidUser = await bcrypt.compare(String(password), user.password);
    if (isValidUser) {
      const { NODE_ENV, JWT_SECRET } = process.env;
      const jwtToken = jsonWebToken.sign(
        {
          _id: user._id,
        },
        NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret',
      );
      res.cookie('jwt', jwtToken, {
        maxAge: 360000000000,
        httpOnly: true,
        sameSite: 'none',
        secure: true,
      });
      res.send({ data: user.toJSON() });
    } else {
      next(new Unauthorized('Неверный пароль.'));
    }
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res, next) => {
  try {
    res.cookie('jwt', null, { maxAge: 0 });
    res.status(200).json(req.user);
  } catch (error) {
    next(error);
  }
};
