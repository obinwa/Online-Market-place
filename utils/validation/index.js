exports.validateSchema = (schema) => (req, res, next) => {
  const { error, value } = schema.validate({
    ...req.body,
    ...req.params,
    ...req.query,
  });

  if (error) {
    res.status(400).json({
      status: false,
      message: error.message.split('"')[1],
      data: null,
    });
  }

  next();
};
