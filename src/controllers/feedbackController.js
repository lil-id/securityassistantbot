const { feedBack } = require("../models/feedBackModel");
const { checkRoles } = require("../helpers/rolesChecker");

async function handleFeedback(client, message, args) {
    try {
        const chat = await client.getChatById(message.from);
        await chat.sendSeen();
        await chat.sendStateTyping();

        const feedBackMessage = args.join(" ");
        const phoneNumber = message.mentionedIds;
        const getRole = await checkRoles(message.author);
        const getMentionsNames = await message.getMentions();

        const names = getMentionsNames
            .map((contact) => contact.name || "Unknown")
            .join(", ");

        if (getRole && getRole.role === "admin") {
            // Get all feedbacks
            if (feedBackMessage.toLowerCase() === "all") {
                const feedbacks = await feedBack.getFeedbacks();
                await message.reply(`All feedbacks:\n\n${feedbacks}`);
                return;
            }
            // Get feedback by phone number
            else if (Array.isArray(phoneNumber) && phoneNumber.length > 0) {
                const feedback = await feedBack.getFeedbackById(phoneNumber);
                await message.reply(`Feedback from ${names}:\n\n${feedback}`);
                return;
            }
            // No feedback message
            else if (!feedBackMessage) {
                await message.reply(
                    "Please provide feedback details or provide argument text.\n\n`!feedback` issue description\n`!feedback all` - Get all feedbacks \n`!feedback <userPhoneNumber>` - Get specific feedback"
                );
                return;
            }
            // Create feedback
            else {
                await feedBack.createFeedback(message.author, feedBackMessage);
                await message.reply(
                    "Thank you for your feedback! It has been recorded."
                );
            }
        } else {
            // No feedback message
            if (!feedBackMessage) {
                await message.reply(
                    "Please provide feedback details or provide argument text.\n\n`!feedback` issue description\n"
                );
                return;
            }
            // Create feedback
            else {
                await feedBack.createFeedback(message.author, feedBackMessage);
                await message.reply(
                    "Thank you for your feedback! It has been recorded."
                );
            }
        }
    } catch (error) {
        console.error("Error handling feedback:", error);
    }
}

module.exports = { handleFeedback };
