const { Router } = require('express');
const logger = require('../../helpers/logger');
const authModel = require('../../models/auth/authModel');
const userSession = require('../../middleware/usersMiddleware');
const adminSession = require('../../middleware/adminsMiddleware');

const authRouter = Router();

authRouter.post("/login", async (req, res) => {
    logger.info("Login...");
    const login = await authModel.login(req.body);
    res.status(200).json({data: login });
});

authRouter.post("/logout", userSession || adminSession, async (req, res) => {
    logger.info("Logout...");

    let id, type;

    if (req.admins) {
        id = req.admins.id;
        type = 'admins';
    } else if (req.users) {
        id = req.users.id;
        type = 'users';
    } else {
        return res.status(400).json({ status: false, message: "Invalid session" });
    }

    const logout = await authModel.logout(id, type);
    res.status(200).json({ data: logout });
});

module.exports = { authRouter }