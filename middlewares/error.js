/* eslint-disable no-unused-vars */
exports.errorHandler = (err, req, res, next) => {
  if (!err.statusCode) {
    res.status(500).send({ message: 'Произошла ошибка на сервере' });
  } else {
    const response = { message: err.message, name: err.name, statusCode: err.statusCode };
    res.status(err.statusCode).send(response);
  }
};
