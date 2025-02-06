const { handleHelp } = require('../controllers/helpController');
const { handleInfo } = require('../controllers/infoController');
const { handleReport } = require('../controllers/reportController');
const { handleSnapshot } = require('../controllers/snapshotController');
const { handleFeedback } = require('../controllers/feedbackController');
const { handleAddAICommand } = require('../controllers/ai/ollamaController');
const { handleBotTermination } = require('../controllers/handleBotTermination');
const { handleContainerStatus } = require('../controllers/containerController');
const { handleAddUserCommand } = require('../controllers/users/addUserController');
const { handleActiveResponse } = require('../controllers/activeResponseController');
const { handleAddAdminCommand } = require('../controllers/admins/addAdminController');
const { handleAccountCheck, handleAccountMonitorCommand } = require('../controllers/accountMonitorController');
const { handleServerStatus, handleMonitorCommand, handleThresholdCommand } = require('../controllers/systemMonitorController');

const adminCommands = {
    "!admin": handleAddAdminCommand,
    "!ask": handleAddAICommand,
    "!user": handleAddUserCommand,
    "!server": handleServerStatus,
    "!monitor": handleMonitorCommand,
    "!threshold": handleThresholdCommand,
    "!account": handleAccountCheck,
    "!accmon": handleAccountMonitorCommand,
    "!container": handleContainerStatus,
    "!snap": handleSnapshot,
    "!response": handleActiveResponse,
    "!feedback": handleFeedback,
    "!report": handleReport,
    "!help": handleHelp,
    "!info": handleInfo,
    "!stop": handleBotTermination,
};

const userCommands = {
    "!server": handleServerStatus,
    "!account": handleAccountCheck,
    "!container": handleContainerStatus,
    "!snap": handleSnapshot,
    "!response": handleActiveResponse,
    "!feedback": handleFeedback,
    "!report": handleReport,
    "!help": handleHelp,
    "!info": handleInfo,
};

module.exports = { adminCommands, userCommands };