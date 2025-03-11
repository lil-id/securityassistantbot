const { botUsers } = require("../../models/users/userModel");
const { userHelpMessage } = require("../../views/responseMessage");

async function handleAddUserCommand(client, message, args) {
    const chat = await client.getChatById(message.from);
    await chat.sendSeen();
    await chat.sendStateTyping();

    const getMentionsNames = await message.getMentions();
    const existingUsers = await botUsers.checkExistingUsers(getMentionsNames);

    if (existingUsers.length > 0) {
        const existingUsersNames = getMentionsNames
            .filter((user) => existingUsers.includes(user.id._serialized))
            .map((user) => `🐨 ${user.name}`)
            .join("\n");
        await message.reply(
            `The following users already exist:\n\n${existingUsersNames}`
        );
    }

    const newUsers = getMentionsNames.filter(
        (user) => !existingUsers.includes(user.id._serialized)
    );
    if (newUsers.length > 0) {
        const addedUsers = await botUsers.addUsers(newUsers);
        const addedUsersNames = (addedUsers || [])
            .map((name) => `🐨 ${name}`)
            .join("\n");
        await message.reply(
            `Users have been added successfully:\n\n${addedUsersNames}`
        );
        await message.reply("Welcome to the team chief! 🎉");
        await message.reply(userHelpMessage);
    }
}

module.exports = { handleAddUserCommand };