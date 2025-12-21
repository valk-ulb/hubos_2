import logger from './logger.js';
import jwt from 'jsonwebtoken'

/**
 * Verify the JWT token in a request header.
 * Not in use.
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
    export function verifyJWT(req, res, next){
        const authHeader = req.headers['authorization'];
        if (!authHeader) return res.sendStatus(401);
        logger.serverInfo(authHeader);
        const token = authHeader.split(' ')[1];
        jwt.verify(
            token, 
            process.env.ACCESS_TOKEN_SECRET,
            (err, decoded) => {
                if (err) return res.sendStatus(403) //invalid token
                req.user = decoded.username;
                next();
            }
        )
    }

    /**
     * create both jwt access and refresh token.
     * @param {String} moduleId 
     * @returns object contening an access token and a refresh token.
     */
    export function createJWT(moduleId){
        const accessToken = jwt.sign(
            {'username':moduleId},
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: process.env.ACCESS_TIME_BEFORE_EXPIRATION}
        );
        const refreshToken = jwt.sign(
            {'username':moduleId},
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: process.env.REFRESH_TIME_BEFORE_EXPIRATION}
        );
        return {accessToken: accessToken, refreshToken: refreshToken};
    }
    
    export function generateSecretKey(){
        return crypto.randomBytes(64).toString('hex');
    }

