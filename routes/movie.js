const express = require('express');
const { celebrate, Segments, Joi } = require('celebrate');
const urlPattern = require('../middlewares/urlPattern');
const movie = require('../controllers/movies');

const router = express.Router();

router.get('/movies', movie.getMovies);

router.post(
  '/movies',
  celebrate({
    [Segments.BODY]: Joi.object().keys({
      country: Joi.string().required(),
      director: Joi.string().required(),
      duration: Joi.number().required(),
      year: Joi.string().required(),
      description: Joi.string().required(),
      image: Joi.string().required().pattern(urlPattern),
      trailerLink: Joi.string().required().pattern(urlPattern),
      thumbnail: Joi.string().required().pattern(urlPattern),
      movieId: Joi.number().required(),
      nameRU: Joi.string().required(),
      nameEN: Joi.string().required(),
    }),
  }),
  movie.createMovie,
);

router.delete(
  '/movies/:_id',
  celebrate({
    [Segments.PARAMS]: {
      _id: Joi.string().hex().length(24).required(),
    },
  }),
  movie.deleteMovie,
);

module.exports = router;
