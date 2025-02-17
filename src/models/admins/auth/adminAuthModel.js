const handleValidationErrors = require("../../../helpers/handleValidationError");
const jwt = require('jsonwebtoken');
const { prisma } = require('../../../helpers/databaseConnection');
const Joi = require('joi');
require('dotenv').config();

class Authentication {
    login = async (body) => {
        try {
            const currentDate = new Date();

            const schema = Joi.object({
                numberPhone: Joi.string()
                    .min(10)
                    .max(12)
                    .pattern(/^[0-9]/)
                    .required(),
            });

            const validation = schema.validate(body);

            if (validation.error)
                return handleValidationErrors(validation.error);

            const admins = await prisma.admins.findUnique({
                where: {
                    numberPhone: `${body.numberPhone}@c.us`,
                },
                select: {
                    id: true,
                    JWTAccessTokenAdmins: {
                        select: {
                            id: true,
                            token: true,
                            expiredIn: true,
                        },
                    }
                }
            });

            if (!admins) {
                return {
                    status: false,
                    message: "failed",
                    code: 404,
                    error: "Login failed. Invalid email or password.",
                };
            }

            // Check JWT token if not exist
            if (!admins.JWTAccessTokenAdmins) {
                const saveAccessToken =
                    await prisma.jWTAccessTokenAdmins.create({
                        data: {
                            idAdmin: admins.id,
                            token: "",
                        },
                    });

                const payload = {
                    id: saveAccessToken.id,
                };

                const token = jwt.sign(payload, process.env.TOKEN_CODE || "", {
                    expiresIn: "7d",
                });

                const tokenExpired = new Date(
                    currentDate.getTime() + 7 * 24 * 60 * 60 * 1000
                );

                await prisma.jWTAccessTokenAdmins.update({
                    where: {
                        id: payload.id,
                    },
                    data: {
                        token,
                        expiredIn: tokenExpired,
                    },
                });

                return {
                    status: true,
                    message: "success",
                    code: 200,
                    token,
                };
            }

            // check if token expired
            let { token } = admins.JWTAccessTokenAdmins;

            const decodedToken = jwt.decode(
                admins.JWTAccessTokenAdmins.token
            );

            if (!decodedToken) {
                throw new Error("Failed to decode token.");
            }

            if (decodedToken.exp * 1000 <= new Date().getTime()) {
                const idJwtAccessTokenAdmins = decodedToken.id;

                const payload = {
                    id: admins.JWTAccessTokenAdmins.id,
                };

                token = jwt.sign(payload, process.env.TOKEN_CODE || "", {
                    expiresIn: "7d",
                });

                const tokenExpired = new Date(
                    currentDate.getTime() + 7 * 24 * 60 * 60 * 1000
                );

                await prisma.jWTAccessTokenAdmins.update({
                    where: {
                        id: idJwtAccessTokenAdmins,
                    },
                    data: {
                        token,
                        expiredIn: tokenExpired,
                    },
                });

                return {
                    status: true,
                    message: "success",
                    code: 200,
                    token
                };
            }

            return {
                status: true,
                message: "success",
                code: 200,
                admins
            };
        } catch (error) {
            console.error("Admins login module error", error);

            return {
                status: false,
                message: "failed",
                code: 400,
                error,
            };
        }
    };

    logout = async (idAdmin) => {
        try {
            await prisma.jWTAccessTokenAdmins.delete({
                where: {
                    idAdmin
                },
            });

            return {
                status: true,
                message: "success",
                code: 200,
            };
        } catch (error) {
            console.error("Admins logout module error", error);

            return {
                status: false,
                message: "failed",
                code: 400,
                error,
            };
        }
    };
}

module.exports = new Authentication();
