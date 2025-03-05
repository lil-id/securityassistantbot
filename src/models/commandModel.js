const { handleHelp } = require('../controllers/helpController');
const { handleInfo } = require('../controllers/infoController');
const { handleReport } = require('../controllers/reportController');
const { handleSnapshot } = require('../controllers/snapshotController');
const { handleFeedback } = require('../controllers/feedbackController');
const { handleAddAICommand } = require('../controllers/ai/ollamaController');
const { handleBotTermination } = require('../controllers/handleBotTermination');
const { handleContainerStatus } = require('../controllers/containerController');
const { handleAddUserCommand } = require('../controllers/users/addUserController');
const { handleActiveResponseSummary } = require('../controllers/activeResponseController');
const { handleAddAdminCommand } = require('../controllers/admins/addAdminController');
const { handleAccountCheck, handleAccountMonitorCommand } = require('../controllers/accountMonitorController');
const { handleServerStatus, handleMonitorCommand, handleThresholdCommand } = require('../controllers/systemMonitorController');
const { handleBotnetCheck } = require('../controllers/handleBotnetCheck');
const { fetchLatestThreats } = require('../controllers/handleThreatIntelligence');

const adminCommands = {
    "!admin": handleAddAdminCommand,
    "!ask": handleAddAICommand,
    "!user": handleAddUserCommand,
    "!server": handleServerStatus,
    // "!monitor": handleMonitorCommand,
    // "!threshold": handleThresholdCommand,
    "!account": handleAccountCheck,
    // "!accmon": handleAccountMonitorCommand,
    "!container": handleContainerStatus,
    "!snap": handleSnapshot,
    "!hunt": fetchLatestThreats,
    "!botnet": handleBotnetCheck,
    "!response": handleActiveResponseSummary,
    "!feedback": handleFeedback,
    "!report": handleReport,
    "!help": handleHelp,
    "!info": handleInfo,
    "!stop": handleBotTermination,
};

const userCommands = {
    "!ask": handleAddAICommand,
    "!server": handleServerStatus,
    "!account": handleAccountCheck,
    "!container": handleContainerStatus,
    "!snap": handleSnapshot,
    "!hunt": fetchLatestThreats,
    "!botnet": handleBotnetCheck,
    "!response": handleActiveResponseSummary,
    "!feedback": handleFeedback,
    "!report": handleReport,
    "!help": handleHelp,
    "!info": handleInfo,
};

module.exports = { adminCommands, userCommands };