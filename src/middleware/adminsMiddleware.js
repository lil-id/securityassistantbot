const jwt = require('jsonwebtoken');
const { prisma } = require('../helpers/databaseConnection');
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
      return res.status(401).send({
        status: false,
        message: 'failed',
        error: 'Not Authorize',
      });
      
    } catch (error) {
      console.log('Admins middleware helpers error: ', error);
      return res.status(401).send({
        status: false,
        message: 'failed',
        error: 'JWT Token Expired',
      });
    }
  }

  if (!token) {
    return res.status(401).send({
      status: false,
      message: 'failed',
      error: 'Not Authorize, No Token',
    });
  }
};

module.exports = adminsSession;
