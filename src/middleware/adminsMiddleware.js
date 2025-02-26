const jwt = require('jsonwebtoken');
const { prisma } = require('../helpers/databaseConnection');
const logger = require('../helpers/logger');
require('dotenv').config();

const adminsSession = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.TOKEN_CODE);
      const admins = await prisma.jWTAccessTokenAdmins.findUnique({
        where: {
          id: decoded.id,
        },
      });

      if (admins) {
        req.admins = {
          id: admins.idAdmin,
        };
        return next();
      } 
      
      throw new Error('Not Authorized');
    } catch (error) {
      logger.info('Admins middleware helpers error: ', error);
      return next();
    }
  }

  return next();
};

module.exports = adminsSession;
