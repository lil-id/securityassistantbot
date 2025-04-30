const { lookupThreat } = require("../../controllers/handleThreatIntelligence");

async function threatFoxCheck(ioc) {
    const threatFoxResult = await lookupThreat(ioc);
    return threatFoxResult;
}

module.exports = { threatFoxCheck }