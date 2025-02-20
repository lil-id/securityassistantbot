const { authUserRouter } = require('../controllers/users/auth/authUserController');
const { authAdminRouter } = require('../controllers/admins/auth/authAdminController');

const setAuthRoutes = (router) => {
    router.use('/user', authUserRouter);
    router.use('/admin', authAdminRouter)
};

module.exports = { setAuthRoutes };