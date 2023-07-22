const Movie = require('../models/movie');
const WrongData = require('../middlewares/WrongDataError');
const WrongId = require('../middlewares/WrongIdError');
const AccessError = require('../middlewares/AccessError');

exports.getMovies = async (req, res, next) => {
  try {
    const currentUser = req.user;

    const movies = await Movie.find({ owner: currentUser._id });

    res.status(200).json(movies);
  } catch (error) {
    next(error);
  }
};

exports.deleteMovie = async (req, res, next) => {
  try {
    const { _id } = req.params;
    const movie = await Movie.findById(_id);
    if (!movie) {
      next(new WrongId('Фильм с указанным _id не найден.'));
      return;
    }
    if (req.user._id !== movie.owner.toString()) {
      next(new AccessError('Ошибка доступа'));
      return;
    }
    await movie.deleteOne({ _id });
    res.status(200).json(movie);
  } catch (error) {
    if (error.name === 'CastError') {
      next(new WrongData('Переданы некорректные данные фильма.'));
    } else {
      next(error);
    }
  }
};

exports.createMovie = async (req, res, next) => {
  try {
    const movieData = { ...req.body };
    const owner = req.user._id;
    const movie = new Movie({ ...movieData, owner });

    const validationError = movie.validateSync();
    if (validationError) {
      next(new WrongData('Переданы некорректные данные фильма.'));
      return;
    }

    const savedMovie = await movie.save();
    res.status(201).json(savedMovie);
  } catch (error) {
    if (error.statusCode === 400) {
      next(new WrongData('Переданы некорректные данные фильма.'));
    }
    next(error);
  }
};
