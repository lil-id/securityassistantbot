const handleValidationErrors = require("../../helpers/handleValidationError");
const jwt = require('jsonwebtoken');
const { prisma } = require('../../helpers/databaseConnection');
const Joi = require('joi');
const logger = require("../../helpers/logger");
require('dotenv').config();

class Authentication {
    login = async (body) => {
        try {
            const schema = Joi.object({
                numberPhone: Joi.string()
                    .min(10)
                    .max(13)
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

            if (!users && !admins) {
                return {
                    status: false,
                    message: "failed",
                    code: 404,
                    error: "Number phone not found.",
                };
            }

            // Handle JWT token for users
            if (users) {
                const userTokenData = await this.handleJWTToken(users, 'users');
                if (userTokenData.status) {
                    return userTokenData;
                }
            }

            // Handle JWT token for admins
            if (admins) {
                const adminTokenData = await this.handleJWTToken(admins, 'admins');
                if (adminTokenData.status) {
                    return adminTokenData;
                }
            }

            return {
                status: false,
                message: "failed",
                code: 400,
                error: "Unexpected error occurred.",
            };
        } catch (error) {
            logger.error("Login module error", error);

            return {
                status: false,
                message: "failed",
                code: 400,
                error,
            };
        }
    };

    handleJWTToken = async (entity, type) => {
        const currentDate = new Date();
        const tokenField = type === 'users' ? 'JWTAccessTokenUsers' : 'JWTAccessTokenAdmins';
        const idField = type === 'users' ? 'idUser' : 'idAdmin';
        const prismaModel = type === 'users' ? prisma.jWTAccessTokenUsers : prisma.jWTAccessTokenAdmins;

        // Check JWT token if not exist
        if (!entity[tokenField]) {
            const saveAccessToken = await prismaModel.create({
                data: {
                    [idField]: entity.id,
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

            await prismaModel.update({
                where: {
                    id: payload.id,
                },
                data: {
                    token,
                    expiredIn: tokenExpired,
                },
            });

            const data = {
                token
            }

            return {
                status: true,
                message: "success",
                code: 200,
                data,
            };
        }

        // check if token expired
        let { token } = entity[tokenField];

        const decodedToken = jwt.decode(entity[tokenField].token);

        if (!decodedToken) {
            throw new Error("Failed to decode token.");
        }

        if (decodedToken.exp * 1000 <= new Date().getTime()) {
            const idJwtAccessToken = decodedToken.id;

            const payload = {
                id: entity[tokenField].id,
            };

            token = jwt.sign(payload, process.env.TOKEN_CODE || "", {
                expiresIn: "7d",
            });

            const tokenExpired = new Date(
                currentDate.getTime() + 7 * 24 * 60 * 60 * 1000
            );

            await prismaModel.update({
                where: {
                    id: idJwtAccessToken,
                },
                data: {
                    token,
                    expiredIn: tokenExpired,
                },
            });

            const data = {
                token
            }

            return {
                status: true,
                message: "success",
                code: 200,
                data
            };
        }

        const data = {
            token: entity[tokenField].token
        }

        return {
            status: true,
            message: "success",
            code: 200,
            data
        };
    }

    logout = async (id, type) => {
        try {
            const idField = type === 'users' ? 'idUser' : 'idAdmin';
            const prismaModel = type === 'users' ? prisma.jWTAccessTokenUsers : prisma.jWTAccessTokenAdmins;

            await prismaModel.delete({
                where: {
                    [idField]: id
                },
            });

            return {
                status: true,
                message: "success",
                code: 200,
            };
        } catch (error) {
            logger.error("Logout module error", error);

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