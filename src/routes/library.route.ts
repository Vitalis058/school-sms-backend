import express from 'express';
import {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  getLibraryAnalytics,
  searchBooks,
  getOverdueBooks,
  getPopularBooks,
  getBookCategories,
  getLibraryMembers,
  getBookIssues,
  issueBook,
  returnBook,
  renewBook,
  getUserBooks,
  payFine,
} from '../controllers/library.controller';
import { authenticate } from '../utils/middleware';

const router = express.Router();

// Protect all routes
router.use(authenticate);

// Book management routes
router.route('/books')
  .get(getBooks)
  .post(createBook);

router.route('/books/:id')
  .get(getBook)
  .patch(updateBook)
  .delete(deleteBook);

// Library analytics
router.get('/analytics', getLibraryAnalytics);

// Search and discovery
router.get('/search', searchBooks);
router.get('/overdue', getOverdueBooks);
router.get('/popular', getPopularBooks);
router.get('/categories', getBookCategories);

// Library members
router.get('/members', getLibraryMembers);

// Book issues and returns
router.route('/issues')
  .get(getBookIssues)
  .post(issueBook);

router.post('/returns', returnBook);
router.post('/renewals', renewBook);

// User's books (for students and teachers)
router.get('/my-books/:userId', getUserBooks);

// Fine management
router.post('/pay-fine', payFine);

export default router; 