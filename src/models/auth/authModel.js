const handleValidationErrors = require("../../helpers/handleValidationError");
const jwt = require('jsonwebtoken');
const { prisma } = require('../../helpers/databaseConnection');
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

            const users = await prisma.users.findUnique({
                where: {
                    numberPhone: `${body.numberPhone}@c.us`,
                },
                select: {
                    id: true,
                    JWTAccessTokenUsers: {
                        select: {
                            id: true,
                            token: true,
                            expiredIn: true,
                        },
                    }
                }
            });

            if (!users) {
                return {
                    status: false,
                    message: "failed",
                    code: 404,
                    error: "Login failed. Invalid email or password.",
                };
            }

            // Check JWT token if not exist
            if (!users.JWTAccessTokenUsers) {
                const saveAccessToken =
                    await prisma.jWTAccessTokenUsers.create({
                        data: {
                            idUser: users.id,
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

                await prisma.jWTAccessTokenUsers.update({
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
            let { token } = users.JWTAccessTokenUsers;

            const decodedToken = jwt.decode(
                users.JWTAccessTokenUsers.token
            );

            if (!decodedToken) {
                throw new Error("Failed to decode token.");
            }

            if (decodedToken.exp * 1000 <= new Date().getTime()) {
                const idJwtAccessTokenUsers = decodedToken.id;

                const payload = {
                    id: users.JWTAccessTokenUsers.id,
                };

                token = jwt.sign(payload, process.env.TOKEN_CODE || "", {
                    expiresIn: "7d",
                });

                const tokenExpired = new Date(
                    currentDate.getTime() + 7 * 24 * 60 * 60 * 1000
                );

                await prisma.jWTAccessTokenUsers.update({
                    where: {
                        id: idJwtAccessTokenUsers,
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
                users
            };
        } catch (error) {
            console.error("Users login module error", error);

            return {
                status: false,
                message: "failed",
                code: 400,
                error,
            };
        }
    };

    logout = async (idUser) => {
        try {
            await prisma.jWTAccessTokenUsers.delete({
                where: {
                    idUser
                },
            });

            return {
                status: true,
                message: "success",
                code: 200,
            };
        } catch (error) {
            console.error("Users logout module error", error);

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
