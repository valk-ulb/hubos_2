import logger from '../utils/logger.js'

export function errorHandler(err, req, res, next) {
    logger.serverError(`Server error: ${req.stack}`,true);
    res.status(500).send(err.message)
}

