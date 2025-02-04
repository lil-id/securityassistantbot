const { handleAddAICommand } = require('../controllers/ai/ollamaController');
const { handleAddAdminCommand } = require('../controllers/admins/addAdminController');
const { handleAddUserCommand } = require('../controllers/users/addUserController');
const { handleServerStatus, handleMonitorCommand, handleThresholdCommand } = require('../controllers/systemMonitorController');
const { handleAccountCheck, handleAccountMonitorCommand } = require('../controllers/accountMonitorController');
const { handleContainerStatus } = require('../controllers/containerController');
const { handleSnapshot } = require('../controllers/snapshotController');
const { handleActiveResponse } = require('../controllers/activeResponseController');
const { handleFeedback } = require('../controllers/feedbackController');
const { handleReport } = require('../controllers/reportController');
const { handleHelp } = require('../controllers/helpController');
const { handleInfo } = require('../controllers/infoController');
const { handleBotTermination } = require('../controllers/handleBotTermination');

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