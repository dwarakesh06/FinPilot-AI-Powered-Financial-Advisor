const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { validateRequest } = require('../middleware/validateRequest');
const { createTransactionSchema, updateTransactionSchema, queryParamsSchema } = require('../validations');
const {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  importTransactionsCSV,
} = require('../controllers/transactionController');

// Multer Config for memory storage file imports
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB file size
});

router.use(protect); // Secure all transaction routes

router.route('/')
  .get(validateRequest(queryParamsSchema), getTransactions)
  .post(validateRequest(createTransactionSchema), createTransaction);

router.post('/import', upload.single('file'), importTransactionsCSV);

router.route('/:id')
  .get(getTransactionById)
  .put(validateRequest(updateTransactionSchema), updateTransaction)
  .delete(deleteTransaction);

module.exports = router;
