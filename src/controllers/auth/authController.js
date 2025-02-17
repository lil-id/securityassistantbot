const { Router } = require('express');
const logger = require('../../helpers/logger');
const authModel = require('../../models/auth/authModel');
const usersSession = require('../../middleware/usersMiddleware');

const authRouter = Router();

authRouter.post("/login", async (req, res) => {
    logger.info("Login user...");
    const login = await authModel.login(req.body);
    res.status(200).json({ status: 'Login successfully', data: login });
});

authRouter.post("/logout", usersSession, async (req, res) => {
    logger.info("Logout user...");
    const { id } = req.users;
    const logout = await authModel.logout(id);
    res.status(200).json({ status: 'Logout successfully', data: logout });
});

module.exports = { authRouter }