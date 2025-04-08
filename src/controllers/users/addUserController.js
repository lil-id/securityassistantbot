const { botUsers } = require("../../models/users/userModel");
const { userHelpMessage } = require("../../views/responseMessage");

async function handleAddDeleteUserCommand(client, message, args) {
    const chat = await client.getChatById(message.from);
    await chat.sendSeen();
    await chat.sendStateTyping();

    // Split the args into individual components
    const parsedArgs = args.join(" ").split(" ");
    const isRemoveCommand = parsedArgs[0]?.toLowerCase() === "remove";
    const getMentionsNames = await message.getMentions();

    if (!getMentionsNames || getMentionsNames.length === 0) {
        message.reply("No valid users mentioned.");
    }

    if (isRemoveCommand) {
        // Handle remove admin command
        const removedUsers = await botUsers.deleteUsers(getMentionsNames);

        if (removedUsers.length > 0) {
            const removedUsersNames = removedUsers
                .map((name) => `🐨 ${name}`)
                .join("\n");
            await message.reply(
                `Users have been removed successfully:\n\n${removedUsersNames}`
            );
        } else {
            message.reply("No users were removed.");
        }
    } else {
        // Handle add users command
        const existingUsers = await botUsers.checkExistingUsers(
            getMentionsNames
        );

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
}

module.exports = { handleAddDeleteUserCommand };
