# 🔒 Boty (Bot Security)

**Boty** is your SOC partner that helps reduce headaches caused by false positives from SIEM. This project automates various security checks and alerting functions using tools and APIs integrated into the bot.

## 📂 Project Structure

```
/securityassistantbot
├── /src
│   ├── /controllers
│   │   ├── accountMonitorController.js     # Handles account monitoring and alert generation for suspicious accounts
│   │   ├── activeResponseController.js     # Processes alerts and manages active response actions
│   │   ├── snapshotController.js           # Handles system snapshot creation and cron schedule updates
│   │   └── ...                             # Other controllers for various functionalities
│   │
│   ├── /helpers
│   │   ├── alertChecker.js                   # Provides functions to determine alert levels and return corresponding emojis
│   │   ├── cronHelper.js                     # Contains helper functions for scheduling cron jobs
│   │   ├── logger.js                         # Custom logger for info, warnings, and errors
│   │   ├── databaseConnection.js             # Handles Prisma database connections and queries
│   │   └── ...                               # Other helper utilities
│   │
│   ├── /middleware
│   │   ├── adminsMiddleware.js               # Middleware that verifies admin tokens
│   │   └── usersMiddleware.js                # Middleware that verifies user tokens
│   │
│   ├── /models
│   │   ├── accountMonitor.js                 # Model to manage system account data
│   │   ├── commandHistory.js                 # Model to record and retrieve command history
│   │   ├── systemMonitor.js                  # Module to check CPU, Memory, and Storage usage
│   │   └── ...                               # Other models
│   │
│   ├── /public
│   │   └── suspiciousSystemAccount.txt       # File to store previous suspicious account results
│   │   └── ...                               # Other files utilities
│   │
│   ├── /scripts
│   │   ├── systemAccount.sh                  # Shell script for system account check
│   │   └── systemSnapshot.sh                 # Shell script to take a system snapshot
│   │
│   └── app.js                                # Entry point of the application
│
├── /test
│   ├── accountMonitorController.test.js      # Tests for account monitoring controller
│   ├── activeResponseController.test.js      # Tests for active response controller
│   ├── snapshotController.test.js            # Tests for snapshot controller
│   ├── commandHistory.test.js                # Tests for command history model
│   ├── systemMonitor.test.js                 # Tests for system monitoring functions
│   ├── adminsMiddleware.test.js              # Tests for admin middleware
│   └── usersMiddleware.test.js               # Tests for user middleware
│
├── package.json                              # Project dependencies and scripts
└── README.md                                 # This project documentation
```

## ⚙️ Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/YourUsername/securityassistantbot.git
   cd securityassistantbot
   ```

2. **Install dependencies:**

   Make sure you have [Node.js](https://nodejs.org/) installed. Then, install the project's dependencies via npm:

   ```bash
   npm install
   ```

## 🛠️ Configuration

- **Environment Variables:**  
  Create a `.env` file at the project root with your configuration settings (e.g., API keys, tokens, LOG_URL, TOKEN_CODE). For example:

  ```env
  TOKEN_CODE=your_secret_code_here
  LOG_URL=https://logs.yourdomain.com
  ```

  See the env.example for full content of .env files

- **Database Connection:**  
  The project uses Prisma for database operations. Make sure you set up your database connection in the `databaseConnection.js` helper and update your Prisma schema if needed.

## 🚀 Running the Project

To start the application:

```bash
node app.js
```

This will start the bot. The application listens for incoming WhatsApp messages and processes them based on the controllers defined in the `/src/controllers` directory.

## 🧪 Running Tests

The project uses [Jest](https://jestjs.io/) for testing. To run the tests, execute:

```bash
npm test
```

This will run all tests in the `/test` folder and display test results in the terminal.

## 📖 Usage

- **🔍 Account Monitoring:**  
  The bot periodically runs scripts to detect suspicious system accounts. If a new suspicious account is found, it notifies the group.
  
- **⚡ Active Response:**  
  When a security alert is triggered, the bot sends a formatted alert message to the WhatsApp group and initiates threat intelligence checks.

- **📊 System Monitoring:**  
  The bot collects CPU, memory, and storage usage statistics and generates a summary alert if thresholds are exceeded.

- **📜 Command History Analysis:**  
  The bot records command history data and provides analysis via AI-powered tools. This helps in auditing activities and investigating potential security incidents.

- **📸 Snapshot Management:**  
  The bot can create system snapshots using predefined shell scripts. These snapshots are useful for system state analysis and are scheduled using cron jobs. The bot also allows dynamic updates to the cron schedule.

- **🌐 Threat Intelligence Integration:**  
  The bot integrates with external threat intelligence sources like ThreatFox and Abuse IP DB to enrich alerts with additional context. This helps teams validate threats and take appropriate actions.

- **🔑 User and Admin Session Management:**  
  The bot uses middleware to verify user and admin tokens for secure access to its features. This ensures that only authorized users can interact with sensitive bot functionalities.

- **📦 Container Status Monitoring:**  
  The bot provides commands to check the status of running containers, helping administrators ensure that critical services are operational.

- **📝 Feedback and Reporting:**  
  Users can submit feedback or report issues directly through the bot. Admins can view all feedback and reports to address concerns or improve the system.

- **🤖 AI-Powered Assistance:**  
  The bot includes an AI-powered assistant that can provide security recommendations or answer user queries. This feature is accessible via the `!ask` command.

- **🛑 Bot Termination:**  
  Admins can securely terminate the bot using the `!stop` command. This ensures that only authorized personnel can shut down the bot.

- **🛡️ Malware and Botnet Checks:**  
  The bot can fetch the latest malware lists and check for malicious IPs associated with botnets. This helps in identifying and mitigating potential threats.

- **❓ Help and Information Commands:**  
  The bot provides detailed help messages (`!help`) and information about its features (`!info`) to assist users and admins in understanding its capabilities.

## 🤖 LLM Model
The LLM model used in this project is [Llama 3.1 8B](https://huggingface.co/kholil-lil/wazuh-model), which has been fine-tuned using a Wazuh alerts dataset. It is designed to classify Wazuh alerts as either **true positives** or **false positives**. Additionally, you can ask it other security-related questions, just like any other LLM.

## 🤝 Contributing

Contributions are welcome! Before submitting a pull request, please ensure your changes follow the project coding guidelines and all tests pass.

## 📜 License

This project is licensed under the MIT License.

Happy Securing!
