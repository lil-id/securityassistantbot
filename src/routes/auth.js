const { authRouter } = require('../controllers/auth/authController');

const setAuthUsersRoutes = (router) => {
    router.use('/users', authRouter);
};

module.exports = { setAuthUsersRoutes };