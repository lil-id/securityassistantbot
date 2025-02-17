const express = require('express');
const { handleSecurityRecommendation } = require('../controllers/ai/ollamaController');

const router = express.Router();

router.post('/ai/recommendation', handleSecurityRecommendation);

const setOllamaRoutes = (app) => {
    app.use('/', router);
};

module.exports = { setOllamaRoutes };