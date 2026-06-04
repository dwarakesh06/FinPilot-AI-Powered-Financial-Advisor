const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { exportCSV, exportPDF } = require('../controllers/reportController');

router.use(protect); // Secure report downloads

router.get('/csv', exportCSV);
router.get('/pdf', exportPDF);

module.exports = router;
