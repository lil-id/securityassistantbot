const { botAdmins } = require("../../models/admins/adminModel");

async function handleAddAdminCommand(client, message, args) {
    const chat = await client.getChatById(message.from);
    await chat.sendSeen();
    await chat.sendStateTyping();

    const getMentionsNames = await message.getMentions();
    const existingAdmins = await botAdmins.checkExistingAdmins(
        getMentionsNames
    );

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
        const addedAdminsNames = addedAdmins
            .map((name) => `🐨 ${name}`)
            .join("\n");
        await message.reply(
            `Admins have been added successfully:\n\n${addedAdminsNames}`
        );
        await message.reply("Welcome to the team chief! 🎉");
    }
}

module.exports = { handleAddAdminCommand };