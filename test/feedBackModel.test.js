const { feedBack } = require('../src/models/feedBackModel');
const { prisma } = require('../src/helpers/databaseConnection');
const logger = require('../src/helpers/logger');

jest.mock('../src/helpers/databaseConnection', () => ({
    prisma: {
        users: { findMany: jest.fn(), create: jest.fn() },
        admins: { findMany: jest.fn(), create: jest.fn() },
        feedbackUsers: { findMany: jest.fn(), create: jest.fn() },
        feedbackAdmins: { findMany: jest.fn(), create: jest.fn() },
    },
}));
jest.mock('../src/helpers/logger');

describe('feedBack Model', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getUserIds', () => {
        it('should return user ids for given phone numbers', async () => {
            prisma.admins.findMany.mockResolvedValue([
                { id: 1, name: 'Admin1', role: 'admin', numberPhone: '123' }
            ]);
            prisma.users.findMany.mockResolvedValue([
                { id: 2, name: 'User1', role: 'user', numberPhone: '456' }
            ]);

            const result = await feedBack.getUserIds(['123', '456']);
            expect(result).toEqual([
                { id: 1, name: 'Admin1', role: 'admin' },
                { id: 2, name: 'User1', role: 'user' }
            ]);
        });

        it('should return an empty array if no users or admins are found', async () => {
            prisma.admins.findMany.mockResolvedValue([]);
            prisma.users.findMany.mockResolvedValue([]);

            const result = await feedBack.getUserIds(['789']);
            expect(result).toEqual([]);
        });
    });

    describe('createFeedback', () => {
        it('should create feedback for admin', async () => {
            prisma.admins.findMany.mockResolvedValue([
                { id: 1, name: 'Admin1', role: 'admin', numberPhone: '123' }
            ]);
            prisma.users.findMany.mockResolvedValue([]);

            await feedBack.createFeedback('123', 'Great job!');
            expect(prisma.feedbackAdmins.create).toHaveBeenCalledWith({
                data: {
                    idAdmin: 1,
                    name: 'Admin1',
                    feedback: 'Great job!',
                }
            });
        });

        it('should create feedback for user', async () => {
            prisma.admins.findMany.mockResolvedValue([]);
            prisma.users.findMany.mockResolvedValue([
                { id: 2, name: 'User1', role: 'user', numberPhone: '456' }
            ]);

            await feedBack.createFeedback('456', 'Great job!');
            expect(prisma.feedbackUsers.create).toHaveBeenCalledWith({
                data: {
                    idUser: 2,
                    name: 'User1',
                    feedback: 'Great job!',
                }
            });
        });
    });

    describe('getFeedbacks', () => {
        it('should return formatted feedbacks', async () => {
            prisma.feedbackAdmins.findMany.mockResolvedValue([
                { feedback: 'Admin feedback', admin: { name: 'Admin1', numberPhone: '123@c.us' } }
            ]);
            prisma.feedbackUsers.findMany.mockResolvedValue([
                { feedback: 'User feedback', user: { name: 'User1', numberPhone: '456@c.us' } }
            ]);

            const result = await feedBack.getFeedbacks();
            expect(result).toContain('📝 *Feedback #1*');
            expect(result).toContain('👤 *Name:* undefined');
            expect(result).toContain('📱 *Phone:* 123');
            expect(result).toContain('💬 *Message:* Admin feedback');
            expect(result).toContain('📝 *Feedback #2*');
            expect(result).toContain('👤 *Name:* undefined');
            expect(result).toContain('📱 *Phone:* 456');
            expect(result).toContain('💬 *Message:* User feedback');
        });

        it('should return "No feedback available." if no feedbacks are found', async () => {
            prisma.feedbackAdmins.findMany.mockResolvedValue([]);
            prisma.feedbackUsers.findMany.mockResolvedValue([]);

            const result = await feedBack.getFeedbacks();
            expect(result).toBe("No feedback available.");
        });
    });

    describe('getFeedbackById', () => {
        it('should return formatted feedbacks for given user phone numbers', async () => {
            prisma.admins.findMany.mockResolvedValue([
                { id: 1, name: 'Admin1', role: 'admin', numberPhone: '123' }
            ]);
            prisma.users.findMany.mockResolvedValue([
                { id: 2, name: 'User1', role: 'user', numberPhone: '456' }
            ]);
            prisma.feedbackAdmins.findMany.mockResolvedValue([
                { feedback: 'Admin feedback', admin: { name: 'Admin1', numberPhone: '123@c.us' } }
            ]);
            prisma.feedbackUsers.findMany.mockResolvedValue([
                { feedback: 'User feedback', user: { name: 'User1', numberPhone: '456@c.us' } }
            ]);

            const result = await feedBack.getFeedbackById(['123', '456']);
            expect(result).toContain('📝 *Feedback #1*');
            expect(result).toContain('👤 *Name:* Admin1');
            expect(result).toContain('📱 *Phone:* 123');
            expect(result).toContain('💬 *Message:* Admin feedback');
            expect(result).toContain('📝 *Feedback #2*');
            expect(result).toContain('👤 *Name:* User1');
            expect(result).toContain('📱 *Phone:* 456');
            expect(result).toContain('💬 *Message:* User feedback');
        });

        it('should return "No feedback available." if no feedbacks are found for given user phone numbers', async () => {
            prisma.admins.findMany.mockResolvedValue([]);
            prisma.users.findMany.mockResolvedValue([]);
            prisma.feedbackAdmins.findMany.mockResolvedValue([]);
            prisma.feedbackUsers.findMany.mockResolvedValue([]);

            const result = await feedBack.getFeedbackById(['789']);
            expect(result).toBe("No feedback available.");
        });
    });
});