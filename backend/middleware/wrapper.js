export function asyncWrapper(fn) {
    return function (req, res, next) {
      fn(req, res)
        .then((value) => {
          if (value && typeof value === 'object' && 'status' in value && 'body' in value) {
            res.status(value.status).json(value.body);
          } else {
            res.send(value);
          }
        })
        .catch(next);
    };
  }
  