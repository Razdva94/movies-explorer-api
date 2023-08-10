/* eslint-disable no-console */
const express = require('express');
const mongoose = require('mongoose');
const {
  celebrate, Segments, Joi, errors,
} = require('celebrate');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { createUser, login, logout } = require('./controllers/users');
const { errorHandler } = require('./middlewares/error');
const { auth } = require('./middlewares/auth');
const movieRoutes = require('./routes/movie');
const userRoutes = require('./routes/user');
const { requestLogger, errorLogger } = require('./middlewares/logger');
const WrongIdError = require('./middlewares/WrongIdError');

const app = express();
app.use(express.json());
app.use(cookieParser());
const { NODE_ENV, BAZE_URL } = process.env;
const mongoURI = (NODE_ENV === 'production') ? BAZE_URL : 'mongodb://0.0.0.0:27017/filmsprojectdb';
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });
app.use(requestLogger);
app.use(
  cors({
    origin: 'https://portfolio-project.nomoreparties.co',
    exposedHeaders: 'Access-Control-Allow-Origin',
    credentials: true,
  }),
);

app.post(
  '/signin',
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      password: Joi.string().required(),
      email: Joi.string().email().required(),
    }),
  }),
  login,
);
app.post(
  '/signup',
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
      name: Joi.string().min(2).max(30).required(),
    }),
  }),
  createUser,
);

app.use(auth);
app.get('/signout', logout);
app.use('/', movieRoutes);
app.use('/', userRoutes);
app.use((req, res, next) => {
  const error = new WrongIdError('Маршрут не найден');
  next(error);
});
app.use(errorLogger);
app.use(errors());
app.use(errorHandler);

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
