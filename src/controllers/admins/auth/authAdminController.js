const { Router } = require('express');
const logger = require('../../../helpers/logger');
const authModel = require('../../../models/admins/auth/adminAuthModel');
const adminSession = require('../../../middleware/adminsMiddleware');

const authAdminRouter = Router();

authAdminRouter.post("/login", async (req, res) => {
    logger.info("Login admin...");
    const login = await authModel.login(req.body);
    res.status(200).json({data: login });
});

authAdminRouter.post("/logout", adminSession, async (req, res) => {
    logger.info("Logout admin...");
    const { id } = req.admins;
    const logout = await authModel.logout(id);
    res.status(200).json({data: logout });
});

module.exports = { authAdminRouter }