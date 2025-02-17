const { Router } = require('express');
const logger = require('../../../helpers/logger');
const authModel = require('../../../models/users/auth/userAuthModel');
const userSession = require('../../../middleware/usersMiddleware');

const authUserRouter = Router();

authUserRouter.post("/login", async (req, res) => {
    logger.info("Login user...");
    const login = await authModel.login(req.body);
    res.status(200).json({ status: 'Login successfully', data: login });
});

authUserRouter.post("/logout", userSession, async (req, res) => {
    logger.info("Logout user...");
    const { id } = req.users;
    const logout = await authModel.logout(id);
    res.status(200).json({ status: 'Logout successfully', data: logout });
});

module.exports = { authUserRouter }