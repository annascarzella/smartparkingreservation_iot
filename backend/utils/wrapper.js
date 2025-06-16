export function asyncWrapper(fn) {
    return function (req, res, next) {
        fn(req).then((value)=>res.send(value)).catch(next);
    };
}