const { authUserRouter } = require('../controllers/users/auth/authUserController');
const { authAdminRouter } = require('../controllers/admins/auth/authAdminController');

const setAuthRoutes = (router) => {
    router.use('/users', authUserRouter);
    router.use('/admins', authAdminRouter)
};

module.exports = { setAuthRoutes };