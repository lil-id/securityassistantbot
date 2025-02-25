const { authRouter } = require('../controllers/auth/authController');

const setAuthRoutes = (router) => {
    router.use('/auth', authRouter)
};

module.exports = { setAuthRoutes };