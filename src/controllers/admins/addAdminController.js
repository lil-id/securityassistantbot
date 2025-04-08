const { botAdmins } = require("../../models/admins/adminModel");
const { adminHelpMessage } = require("../../views/responseMessage");

async function handleAddDeleteAdminCommand(client, message, args) {
    const chat = await client.getChatById(message.from);
    await chat.sendSeen();
    await chat.sendStateTyping();

    // Split the args into individual components
    const parsedArgs = args.join(" ").split(" ");
    const isRemoveCommand = parsedArgs[0]?.toLowerCase() === "remove";
    const getMentionsNames = await message.getMentions();

    if (!getMentionsNames || getMentionsNames.length === 0) {
        message.reply("No valid admins mentioned.");
        return;
    }

    if (isRemoveCommand) {
        // Handle remove admin command
        const removedAdmins = await botAdmins.deleteAdmins(getMentionsNames);

        if (removedAdmins.length > 0) {
            const removedAdminsNames = removedAdmins
                .map((name) => `🐨 ${name}`)
                .join("\n");
            await message.reply(
                `Admins have been removed successfully:\n\n${removedAdminsNames}`
            );
        } else {
            message.reply("No admins were removed.");
        }
    } else {
        // Handle add admins command
        const existingAdmins = await botAdmins.checkExistingAdmins(getMentionsNames);

        if (existingAdmins.length > 0) {
            const existingAdminsNames = getMentionsNames
                .filter((admin) => existingAdmins.includes(admin.id._serialized))
                .map((admin) => `🐨 ${admin.name}`)
                .join("\n");
            await message.reply(
                `The following admins already exist:\n\n${existingAdminsNames}`
            );
        }

        const newAdmins = getMentionsNames.filter(
            (admin) => !existingAdmins.includes(admin.id._serialized)
        );

        if (newAdmins.length > 0) {
            const addedAdmins = await botAdmins.addAdmins(newAdmins);
            const addedAdminsNames = (addedAdmins || [])
                .map((name) => `🐨 ${name}`)
                .join("\n");
            await message.reply(
                `Admins have been added successfully:\n\n${addedAdminsNames}`
            );
            await message.reply("Welcome to the team chief! 🎉");
            await message.reply(adminHelpMessage);
        }
    }
}

module.exports = { handleAddDeleteAdminCommand };