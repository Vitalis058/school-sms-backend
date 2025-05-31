import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';

// Mock data for library functionality
const mockBooks = [
  {
    id: '1',
    title: 'Introduction to Computer Science',
    author: 'John Smith',
    isbn: '978-0123456789',
    category: 'Technology',
    totalCopies: 5,
    availableCopies: 3,
    publishedYear: 2023,
    description: 'A comprehensive guide to computer science fundamentals',
    location: 'A1-001',
    language: 'English',
    pages: 450,
    price: 89.99,
    status: 'AVAILABLE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Advanced Mathematics',
    author: 'Jane Doe',
    isbn: '978-0987654321',
    category: 'Mathematics',
    totalCopies: 8,
    availableCopies: 6,
    publishedYear: 2022,
    description: 'Advanced mathematical concepts and applications',
    location: 'B2-045',
    language: 'English',
    pages: 620,
    price: 125.50,
    status: 'AVAILABLE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'World History',
    author: 'Robert Johnson',
    isbn: '978-0456789123',
    category: 'History',
    totalCopies: 4,
    availableCopies: 2,
    publishedYear: 2021,
    description: 'A comprehensive overview of world history',
    location: 'C3-012',
    language: 'English',
    pages: 780,
    price: 95.75,
    status: 'AVAILABLE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Physics Fundamentals',
    author: 'Dr. Sarah Wilson',
    isbn: '978-0789123456',
    category: 'Science',
    totalCopies: 6,
    availableCopies: 4,
    publishedYear: 2023,
    description: 'Essential physics concepts for students',
    location: 'D1-078',
    language: 'English',
    pages: 520,
    price: 110.00,
    status: 'AVAILABLE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'English Literature Classics',
    author: 'Prof. Michael Brown',
    isbn: '978-0321654987',
    category: 'Literature',
    totalCopies: 10,
    availableCopies: 7,
    publishedYear: 2022,
    description: 'Collection of classic English literature',
    location: 'E2-156',
    language: 'English',
    pages: 890,
    price: 75.25,
    status: 'AVAILABLE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock library members
const mockMembers = [
  {
    id: '1',
    userId: '1',
    userType: 'STUDENT',
    name: 'John Student',
    email: 'john.student@school.com',
    phone: '+1234567890',
    maxBooksAllowed: 3,
    currentBooksIssued: 2,
    totalFines: 0,
    status: 'ACTIVE',
    joinedAt: '2024-01-01',
    address: '123 Student St, City',
    membershipNumber: 'STU001',
  },
  {
    id: '2',
    userId: '2',
    userType: 'TEACHER',
    name: 'Jane Teacher',
    email: 'jane.teacher@school.com',
    phone: '+1234567891',
    maxBooksAllowed: 5,
    currentBooksIssued: 1,
    totalFines: 10.00,
    status: 'ACTIVE',
    joinedAt: '2024-01-01',
    address: '456 Teacher Ave, City',
    membershipNumber: 'TEA001',
  },
  {
    id: '3',
    userId: '3',
    userType: 'STUDENT',
    name: 'Alice Johnson',
    email: 'alice.johnson@school.com',
    phone: '+1234567892',
    maxBooksAllowed: 3,
    currentBooksIssued: 0,
    totalFines: 5.50,
    status: 'ACTIVE',
    joinedAt: '2024-02-15',
    address: '789 Student Rd, City',
    membershipNumber: 'STU002',
  },
  {
    id: '4',
    userId: '4',
    userType: 'TEACHER',
    name: 'Dr. Robert Smith',
    email: 'robert.smith@school.com',
    phone: '+1234567893',
    maxBooksAllowed: 5,
    currentBooksIssued: 3,
    totalFines: 0,
    status: 'ACTIVE',
    joinedAt: '2023-09-01',
    address: '321 Faculty Blvd, City',
    membershipNumber: 'TEA002',
  },
];

// Mock book issues
let mockBookIssues = [
  {
    id: '1',
    bookId: '1',
    userId: '1',
    userType: 'STUDENT',
    issueDate: '2024-01-15',
    dueDate: '2024-02-15',
    returnDate: null,
    status: 'ISSUED',
    renewalCount: 0,
    maxRenewals: 2,
    fineAmount: 0,
    finePaid: false,
    notes: 'First issue',
    issuedBy: 'librarian1',
    returnedTo: null,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    book: mockBooks[0],
    member: mockMembers[0],
  },
  {
    id: '2',
    bookId: '2',
    userId: '2',
    userType: 'TEACHER',
    issueDate: '2024-01-20',
    dueDate: '2024-02-20',
    returnDate: null,
    status: 'OVERDUE',
    renewalCount: 1,
    maxRenewals: 3,
    fineAmount: 10.00,
    finePaid: false,
    notes: 'Renewed once',
    issuedBy: 'librarian1',
    returnedTo: null,
    createdAt: '2024-01-20T14:30:00Z',
    updatedAt: '2024-02-21T09:00:00Z',
    book: mockBooks[1],
    member: mockMembers[1],
  },
  {
    id: '3',
    bookId: '3',
    userId: '4',
    userType: 'TEACHER',
    issueDate: '2024-02-01',
    dueDate: '2024-03-01',
    returnDate: null,
    status: 'OVERDUE',
    renewalCount: 0,
    maxRenewals: 3,
    fineAmount: 15.00,
    finePaid: false,
    notes: 'Research purpose',
    issuedBy: 'librarian2',
    returnedTo: null,
    createdAt: '2024-02-01T11:15:00Z',
    updatedAt: '2024-03-02T08:00:00Z',
    book: mockBooks[2],
    member: mockMembers[3],
  },
  {
    id: '4',
    bookId: '4',
    userId: '1',
    userType: 'STUDENT',
    issueDate: '2024-02-10',
    dueDate: '2024-03-10',
    returnDate: '2024-03-08',
    status: 'RETURNED',
    renewalCount: 0,
    maxRenewals: 2,
    fineAmount: 0,
    finePaid: true,
    notes: 'Returned in good condition',
    issuedBy: 'librarian1',
    returnedTo: 'librarian2',
    createdAt: '2024-02-10T16:20:00Z',
    updatedAt: '2024-03-08T13:45:00Z',
    book: mockBooks[3],
    member: mockMembers[0],
  },
  {
    id: '5',
    bookId: '5',
    userId: '4',
    userType: 'TEACHER',
    issueDate: '2024-02-25',
    dueDate: '2024-03-25',
    returnDate: null,
    status: 'ISSUED',
    renewalCount: 0,
    maxRenewals: 3,
    fineAmount: 0,
    finePaid: false,
    notes: 'For curriculum development',
    issuedBy: 'librarian2',
    returnedTo: null,
    createdAt: '2024-02-25T09:30:00Z',
    updatedAt: '2024-02-25T09:30:00Z',
    book: mockBooks[4],
    member: mockMembers[3],
  },
];

const mockLibraryAnalytics = {
  totalBooks: 150,
  availableBooks: 120,
  issuedBooks: 30,
  overdueBooks: 5,
  activeMembers: 85,
  totalFines: 250.50,
  collectedFines: 180.25,
  monthlyIssues: [
    { month: 'January', issues: 45, returns: 42 },
    { month: 'February', issues: 52, returns: 48 },
    { month: 'March', issues: 38, returns: 41 },
  ],
  popularBooks: [
    { bookId: '1', title: 'Introduction to Computer Science', author: 'John Smith', issueCount: 15 },
    { bookId: '2', title: 'Advanced Mathematics', author: 'Jane Doe', issueCount: 12 },
    { bookId: '3', title: 'World History', author: 'Robert Johnson', issueCount: 10 },
  ],
  categoryStats: [
    { category: 'Technology', totalBooks: 25, issuedBooks: 8, utilizationRate: 32 },
    { category: 'Mathematics', totalBooks: 30, issuedBooks: 12, utilizationRate: 40 },
    { category: 'History', totalBooks: 20, issuedBooks: 5, utilizationRate: 25 },
    { category: 'Science', totalBooks: 35, issuedBooks: 15, utilizationRate: 43 },
    { category: 'Literature', totalBooks: 40, issuedBooks: 10, utilizationRate: 25 },
  ],
};

// Helper function to calculate days overdue
const calculateDaysOverdue = (dueDate: string): number => {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

// Helper function to calculate fine amount
const calculateFine = (daysOverdue: number, userType: string): number => {
  const dailyFine = userType === 'STUDENT' ? 1.0 : 2.0; // Different rates for students and teachers
  return daysOverdue * dailyFine;
};

export const getBooks = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const search = req.query.search as string;
  const category = req.query.category as string;

  let filteredBooks = [...mockBooks];

  // Apply search filter
  if (search) {
    filteredBooks = filteredBooks.filter(book => 
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author.toLowerCase().includes(search.toLowerCase()) ||
      book.isbn.includes(search)
    );
  }

  // Apply category filter
  if (category) {
    filteredBooks = filteredBooks.filter(book => book.category === category);
  }

  // Pagination
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

  res.status(200).json({
    status: 'success',
    data: paginatedBooks,
    total: filteredBooks.length,
    page,
    pageSize,
    totalPages: Math.ceil(filteredBooks.length / pageSize),
  });
});

export const getBook = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const book = mockBooks.find(b => b.id === id);

  if (!book) {
    return next(new AppError('Book not found', 404));
  }

  res.status(200).json({
    status: 'success',
    data: book,
  });
});

export const createBook = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { title, author, isbn, category, totalCopies, publishedYear, description, location, language, pages, price } = req.body;

  const newBook = {
    id: (mockBooks.length + 1).toString(),
    title,
    author,
    isbn,
    category,
    totalCopies: parseInt(totalCopies),
    availableCopies: parseInt(totalCopies),
    publishedYear: parseInt(publishedYear),
    description,
    location: location || 'A1-000',
    language: language || 'English',
    pages: pages || 0,
    price: price || 0,
    status: 'AVAILABLE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockBooks.push(newBook);

  res.status(201).json({
    status: 'success',
    data: newBook,
  });
});

export const updateBook = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const bookIndex = mockBooks.findIndex(b => b.id === id);

  if (bookIndex === -1) {
    return next(new AppError('Book not found', 404));
  }

  const updatedBook = {
    ...mockBooks[bookIndex],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };

  mockBooks[bookIndex] = updatedBook;

  res.status(200).json({
    status: 'success',
    data: updatedBook,
  });
});

export const deleteBook = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const bookIndex = mockBooks.findIndex(b => b.id === id);

  if (bookIndex === -1) {
    return next(new AppError('Book not found', 404));
  }

  mockBooks.splice(bookIndex, 1);

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

export const getLibraryAnalytics = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    status: 'success',
    data: mockLibraryAnalytics,
  });
});

export const searchBooks = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const query = req.query.query as string;
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  if (!query) {
    return res.status(200).json({
      status: 'success',
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    });
  }

  const filteredBooks = mockBooks.filter(book => 
    book.title.toLowerCase().includes(query.toLowerCase()) ||
    book.author.toLowerCase().includes(query.toLowerCase()) ||
    book.isbn.includes(query) ||
    book.category.toLowerCase().includes(query.toLowerCase())
  );

  // Pagination
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedBooks = filteredBooks.slice(startIndex, endIndex);

  res.status(200).json({
    status: 'success',
    data: paginatedBooks,
    total: filteredBooks.length,
    page,
    pageSize,
    totalPages: Math.ceil(filteredBooks.length / pageSize),
  });
});

export const getOverdueBooks = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  // Filter overdue issues from mockBookIssues
  const overdueIssues = mockBookIssues.filter(issue => {
    if (issue.status !== 'OVERDUE') return false;
    
    // Calculate if actually overdue
    const dueDate = new Date(issue.dueDate);
    const today = new Date();
    return today > dueDate;
  });

  // Update overdue issues with calculated fines and days overdue
  const updatedOverdueIssues = overdueIssues.map(issue => {
    const daysOverdue = calculateDaysOverdue(issue.dueDate);
    const calculatedFine = calculateFine(daysOverdue, issue.userType);
    
    return {
      ...issue,
      fineAmount: calculatedFine,
      daysOverdue,
    };
  });

  // Pagination
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedIssues = updatedOverdueIssues.slice(startIndex, endIndex);

  res.status(200).json({
    status: 'success',
    data: paginatedIssues,
    total: updatedOverdueIssues.length,
    page,
    pageSize,
    totalPages: Math.ceil(updatedOverdueIssues.length / pageSize),
  });
});

export const getPopularBooks = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    status: 'success',
    data: mockLibraryAnalytics.popularBooks,
  });
});

export const getBookCategories = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const categories = ['Technology', 'Mathematics', 'History', 'Science', 'Literature', 'Arts'];
  
  res.status(200).json({
    status: 'success',
    data: categories,
  });
});

// Library Members
export const getLibraryMembers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  res.status(200).json({
    status: 'success',
    data: mockMembers,
    total: mockMembers.length,
    page,
    pageSize,
    totalPages: Math.ceil(mockMembers.length / pageSize),
  });
});

// Book Issues
export const getBookIssues = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  res.status(200).json({
    status: 'success',
    data: mockBookIssues.slice((page - 1) * pageSize, page * pageSize),
    total: mockBookIssues.length,
    page,
    pageSize,
    totalPages: Math.ceil(mockBookIssues.length / pageSize),
  });
});

export const issueBook = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { bookId, userId, userType, notes } = req.body;

  // Validate required fields
  if (!bookId || !userId || !userType) {
    return next(new AppError('Book ID, User ID, and User Type are required', 400));
  }

  // Find the book
  const book = mockBooks.find(b => b.id === bookId);
  if (!book) {
    return next(new AppError('Book not found', 404));
  }

  // Check if book is available
  if (book.availableCopies <= 0) {
    return next(new AppError('Book is not available for issue', 400));
  }

  // Find the member
  const member = mockMembers.find(m => m.userId === userId);
  if (!member) {
    return next(new AppError('Library member not found', 404));
  }

  // Check if member has reached maximum book limit
  if (member.currentBooksIssued >= member.maxBooksAllowed) {
    return next(new AppError('Member has reached maximum book limit', 400));
  }

  // Calculate due date (30 days for students, 60 days for teachers)
  const daysToAdd = userType === 'STUDENT' ? 30 : 60;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + daysToAdd);

  // Create new issue
  const newIssue = {
    id: Date.now().toString(),
    bookId,
    userId,
    userType,
    issueDate: new Date().toISOString(),
    dueDate: dueDate.toISOString(),
    returnDate: null,
    status: 'ISSUED',
    renewalCount: 0,
    maxRenewals: userType === 'STUDENT' ? 2 : 3,
    fineAmount: 0,
    finePaid: false,
    notes: notes || '',
    issuedBy: 'librarian1', // In real app, this would be the current user
    returnedTo: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    book,
    member,
  };

  mockBookIssues.push(newIssue);

  // Update book availability
  book.availableCopies -= 1;

  // Update member's current books count
  member.currentBooksIssued += 1;

  res.status(201).json({
    status: 'success',
    data: newIssue,
  });
});

export const returnBook = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { issueId, condition, notes } = req.body;

  // Validate required fields
  if (!issueId) {
    return next(new AppError('Issue ID is required', 400));
  }

  // Find the issue
  const issueIndex = mockBookIssues.findIndex(i => i.id === issueId);

  if (issueIndex === -1) {
    return next(new AppError('Issue not found', 404));
  }

  const issue = mockBookIssues[issueIndex];

  // Check if already returned
  if (issue.status === 'RETURNED') {
    return next(new AppError('Book is already returned', 400));
  }

  const today = new Date();
  const dueDate = new Date(issue.dueDate);
  const daysOverdue = calculateDaysOverdue(issue.dueDate);
  let fine = 0;

  // Calculate fine if overdue
  if (today > dueDate) {
    fine = calculateFine(daysOverdue, issue.userType);
  }

  // Update issue status
  issue.status = 'RETURNED';
  issue.returnDate = today.toISOString();
  issue.returnedTo = 'librarian1'; // In real app, this would be the current user
  issue.fineAmount = fine;
  issue.finePaid = fine === 0;
  issue.notes = notes ? `${issue.notes}; Return: ${notes}` : issue.notes;
  issue.updatedAt = today.toISOString();

  mockBookIssues[issueIndex] = issue;

  // Update book availability
  const book = mockBooks.find(b => b.id === issue.bookId);
  if (book) {
    book.availableCopies += 1;
  }

  // Update member's current books count
  const member = mockMembers.find(m => m.userId === issue.userId);
  if (member) {
    member.currentBooksIssued -= 1;
    if (fine > 0) {
      member.totalFines += fine;
    }
  }

  res.status(200).json({
    status: 'success',
    message: 'Book returned successfully',
    data: {
      issue,
      fine: fine > 0 ? { amount: fine, daysOverdue } : null,
    },
  });
});

// Renew book
export const renewBook = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { issueId } = req.body;

  if (!issueId) {
    return next(new AppError('Issue ID is required', 400));
  }

  const issueIndex = mockBookIssues.findIndex(i => i.id === issueId);

  if (issueIndex === -1) {
    return next(new AppError('Issue not found', 404));
  }

  const issue = mockBookIssues[issueIndex];

  // Check if book can be renewed
  if (issue.status !== 'ISSUED' && issue.status !== 'OVERDUE') {
    return next(new AppError('Book cannot be renewed', 400));
  }

  if (issue.renewalCount >= issue.maxRenewals) {
    return next(new AppError('Maximum renewals reached', 400));
  }

  // Check if there are pending fines
  if (issue.fineAmount > 0 && !issue.finePaid) {
    return next(new AppError('Please pay pending fines before renewal', 400));
  }

  // Extend due date
  const currentDueDate = new Date(issue.dueDate);
  const extensionDays = issue.userType === 'STUDENT' ? 15 : 30;
  currentDueDate.setDate(currentDueDate.getDate() + extensionDays);

  // Update issue
  issue.dueDate = currentDueDate.toISOString();
  issue.renewalCount += 1;
  issue.status = 'ISSUED';
  issue.updatedAt = new Date().toISOString();

  mockBookIssues[issueIndex] = issue;

  res.status(200).json({
    status: 'success',
    message: 'Book renewed successfully',
    data: issue,
  });
});

// Get user's books (for students and teachers)
export const getUserBooks = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.params;
  const { status } = req.query;

  let userIssues = mockBookIssues.filter(issue => issue.userId === userId);

  if (status && status !== 'all') {
    userIssues = userIssues.filter(issue => issue.status === status);
  }

  res.status(200).json({
    status: 'success',
    data: userIssues,
    total: userIssues.length,
  });
});

// Pay fine
export const payFine = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { issueId, amount, paymentMethod } = req.body;

  if (!issueId || !amount || !paymentMethod) {
    return next(new AppError('Issue ID, amount, and payment method are required', 400));
  }

  const issueIndex = mockBookIssues.findIndex(i => i.id === issueId);

  if (issueIndex === -1) {
    return next(new AppError('Issue not found', 404));
  }

  const issue = mockBookIssues[issueIndex];

  if (issue.fineAmount === 0) {
    return next(new AppError('No fine to pay for this issue', 400));
  }

  if (amount < issue.fineAmount) {
    return next(new AppError('Payment amount is less than fine amount', 400));
  }

  // Update issue
  issue.finePaid = true;
  issue.updatedAt = new Date().toISOString();

  // Update member's total fines
  const member = mockMembers.find(m => m.userId === issue.userId);
  if (member) {
    member.totalFines = Math.max(0, member.totalFines - issue.fineAmount);
  }

  mockBookIssues[issueIndex] = issue;

  res.status(200).json({
    status: 'success',
    message: 'Fine paid successfully',
    data: {
      issue,
      paymentDetails: {
        amount,
        paymentMethod,
        paidAt: new Date().toISOString(),
      },
    },
  });
}); 