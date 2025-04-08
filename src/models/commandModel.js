const { handleHelp } = require('../controllers/helpController');
const { handleInfo } = require('../controllers/infoController');
const { handleReport } = require('../controllers/reportController');
const { handleSnapshot } = require('../controllers/snapshotController');
const { handleFeedback } = require('../controllers/feedbackController');
const { handleAddAICommand } = require('../controllers/ai/ollamaController');
const { handleBotTermination } = require('../controllers/handleBotTermination');
const { handleContainerStatus } = require('../controllers/containerController');
const { handleAddDeleteUserCommand } = require('../controllers/users/addUserController');
const { handleActiveResponseSummary } = require('../controllers/activeResponseController');
const { handleAddDeleteAdminCommand } = require('../controllers/admins/addAdminController');
const { handleAccountCheck } = require('../controllers/accountMonitorController');
const { handleServerStatus, handleMonitorCommand, handleThresholdCommand } = require('../controllers/systemMonitorController');
const { handleBotnetCheck } = require('../controllers/handleBotnetCheck');
const { fetchLatestThreats } = require('../controllers/handleThreatIntelligence');
const { handleCommandHistory } = require('../controllers/commandHistoryController');
const { getMalwareList } = require('../controllers/handleMalwareList');

const adminCommands = {
    "!admin": handleAddDeleteAdminCommand,
    "!user": handleAddDeleteUserCommand,
    "!ask": handleAddAICommand,
    "!server": handleServerStatus,
    "!monitor": handleMonitorCommand,
    "!threshold": handleThresholdCommand,
    "!account": handleAccountCheck,
    "!container": handleContainerStatus,
    "!snap": handleSnapshot,
    "!hunt": fetchLatestThreats,
    "!malware": getMalwareList,
    "!botnet": handleBotnetCheck,
    "!summary": handleActiveResponseSummary,
    "!feedback": handleFeedback,
    "!report": handleReport,
    "!history": handleCommandHistory, 
    "!help": handleHelp,
    "!info": handleInfo,
    "!stop": handleBotTermination,
};

const userCommands = {
    "!ask": handleAddAICommand,
    "!server": handleServerStatus,
    "!monitor": handleMonitorCommand,
    "!account": handleAccountCheck,
    "!container": handleContainerStatus,
    "!snap": handleSnapshot,
    "!hunt": fetchLatestThreats,
    "!malware": getMalwareList,
    "!botnet": handleBotnetCheck,
    "!summary": handleActiveResponseSummary,
    "!feedback": handleFeedback,
    "!report": handleReport,
    "!help": handleHelp,
    "!info": handleInfo,
};

module.exports = { adminCommands, userCommands };