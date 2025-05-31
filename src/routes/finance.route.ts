import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../utils/middleware';
import { RESOURCES, ACTIONS } from '../utils/rbac';

const router = Router();

// Apply real authentication to all routes
router.use(authenticate);

// Mock data for demonstration
const mockFeeStructures = [
  {
    id: "1",
    name: "Tuition Fee Term 1",
    description: "First term tuition fee",
    gradeId: "1",
    streamId: null,
    academicYear: "2024",
    term: "1",
    amount: 15000,
    dueDate: "2024-03-15",
    isOptional: false,
    category: "TUITION",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Examination Fee",
    description: "Mid-term examination fee",
    gradeId: "1",
    streamId: null,
    academicYear: "2024",
    term: "1",
    amount: 2500,
    dueDate: "2024-02-28",
    isOptional: false,
    category: "EXAMINATION",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
];

const mockFeeRecords = [
  {
    id: "1",
    studentId: "1",
    feeStructureId: "1",
    totalAmount: 15000,
    paidAmount: 15000,
    balanceAmount: 0,
    status: "PAID",
    dueDate: "2024-03-15",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-02-15T00:00:00Z",
    Student: {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      admissionNumber: "ADM001",
    },
    FeeStructure: {
      id: "1",
      name: "Tuition Fee Term 1",
      category: "TUITION",
    },
  },
  {
    id: "2",
    studentId: "2",
    feeStructureId: "1",
    totalAmount: 15000,
    paidAmount: 7500,
    balanceAmount: 7500,
    status: "PARTIAL",
    dueDate: "2024-03-15",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-02-10T00:00:00Z",
    Student: {
      id: "2",
      firstName: "Jane",
      lastName: "Smith",
      admissionNumber: "ADM002",
    },
    FeeStructure: {
      id: "1",
      name: "Tuition Fee Term 1",
      category: "TUITION",
    },
  },
];

const mockPayments = [
  {
    id: "1",
    studentId: "1",
    feeStructureId: "1",
    amount: 15000,
    paymentDate: "2024-02-15",
    paymentMethod: "BANK_TRANSFER",
    transactionId: "TXN123456",
    status: "COMPLETED",
    receiptNumber: "RCP001",
    remarks: "Full payment for Term 1",
    createdAt: "2024-02-15T00:00:00Z",
    updatedAt: "2024-02-15T00:00:00Z",
    Student: {
      id: "1",
      firstName: "John",
      lastName: "Doe",
      admissionNumber: "ADM001",
    },
  },
  {
    id: "2",
    studentId: "2",
    feeStructureId: "1",
    amount: 7500,
    paymentDate: "2024-02-10",
    paymentMethod: "CASH",
    transactionId: null,
    status: "COMPLETED",
    receiptNumber: "RCP002",
    remarks: "Partial payment",
    createdAt: "2024-02-10T00:00:00Z",
    updatedAt: "2024-02-10T00:00:00Z",
    Student: {
      id: "2",
      firstName: "Jane",
      lastName: "Smith",
      admissionNumber: "ADM002",
    },
  },
];

const mockAnalytics = {
  totalFeesCollected: 2450000,
  totalOutstanding: 350000,
  collectionRate: 87.5,
  totalStudents: 450,
  paidStudents: 394,
  pendingStudents: 56,
  overdueStudents: 12,
  monthlyCollection: [
    { month: "Jan", amount: 420000, count: 89 },
    { month: "Feb", amount: 380000, count: 85 },
    { month: "Mar", amount: 450000, count: 95 },
    { month: "Apr", amount: 410000, count: 88 },
    { month: "May", amount: 390000, count: 82 },
    { month: "Jun", amount: 400000, count: 87 },
  ],
  categoryWiseCollection: [
    { category: "TUITION", amount: 1800000, percentage: 73.5 },
    { category: "EXAMINATION", amount: 250000, percentage: 10.2 },
    { category: "LIBRARY", amount: 150000, percentage: 6.1 },
    { category: "LABORATORY", amount: 120000, percentage: 4.9 },
    { category: "TRANSPORT", amount: 130000, percentage: 5.3 },
  ],
  gradeWiseCollection: [
    { gradeId: "1", gradeName: "Grade 1", totalAmount: 300000, collectedAmount: 270000, collectionRate: 90 },
    { gradeId: "2", gradeName: "Grade 2", totalAmount: 320000, collectedAmount: 288000, collectionRate: 90 },
    { gradeId: "3", gradeName: "Grade 3", totalAmount: 340000, collectedAmount: 289000, collectionRate: 85 },
    { gradeId: "4", gradeName: "Grade 4", totalAmount: 360000, collectedAmount: 306000, collectionRate: 85 },
    { gradeId: "5", gradeName: "Grade 5", totalAmount: 380000, collectedAmount: 323000, collectionRate: 85 },
  ],
};

// Fee Structure Management
router.get('/fee-structures', authorize(RESOURCES.STUDENTS, ACTIONS.READ), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gradeId, streamId, academicYear, category, isOptional } = req.query;
    
    let filteredStructures = [...mockFeeStructures];
    
    if (gradeId) {
      filteredStructures = filteredStructures.filter(fs => fs.gradeId === gradeId);
    }
    
    if (streamId) {
      filteredStructures = filteredStructures.filter(fs => fs.streamId === streamId);
    }
    
    if (academicYear) {
      filteredStructures = filteredStructures.filter(fs => fs.academicYear === academicYear);
    }
    
    if (category) {
      filteredStructures = filteredStructures.filter(fs => fs.category === category);
    }
    
    if (isOptional !== undefined) {
      filteredStructures = filteredStructures.filter(fs => fs.isOptional === (isOptional === 'true'));
    }

    res.json({
      success: true,
      data: filteredStructures,
      pagination: {
        total: filteredStructures.length,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/fee-structures/:id', authorize(RESOURCES.STUDENTS, ACTIONS.READ), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const feeStructure = mockFeeStructures.find(fs => fs.id === id);
    
    if (!feeStructure) {
      res.status(404).json({
        success: false,
        message: 'Fee structure not found',
      });
      return;
    }

    res.json({
      success: true,
      data: feeStructure,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/fee-structures', authorize(RESOURCES.STUDENTS, ACTIONS.CREATE), (req: Request, res: Response, next: NextFunction) => {
  try {
    const newFeeStructure = {
      id: (mockFeeStructures.length + 1).toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockFeeStructures.push(newFeeStructure);

    res.status(201).json({
      success: true,
      data: newFeeStructure,
      message: 'Fee structure created successfully',
    });
  } catch (error) {
    next(error);
  }
});

router.put('/fee-structures/:id', authorize(RESOURCES.STUDENTS, ACTIONS.UPDATE), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const index = mockFeeStructures.findIndex(fs => fs.id === id);
    
    if (index === -1) {
      res.status(404).json({
        success: false,
        message: 'Fee structure not found',
      });
      return;
    }

    mockFeeStructures[index] = {
      ...mockFeeStructures[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: mockFeeStructures[index],
      message: 'Fee structure updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

router.delete('/fee-structures/:id', authorize(RESOURCES.STUDENTS, ACTIONS.DELETE), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const index = mockFeeStructures.findIndex(fs => fs.id === id);
    
    if (index === -1) {
      res.status(404).json({
        success: false,
        message: 'Fee structure not found',
      });
      return;
    }

    mockFeeStructures.splice(index, 1);

    res.json({
      success: true,
      message: 'Fee structure deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Fee Records Management
router.get('/fee-records', authorize(RESOURCES.STUDENTS, ACTIONS.READ), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gradeId, streamId, studentId, academicYear, status, search } = req.query;
    
    let filteredRecords = [...mockFeeRecords];
    
    if (studentId) {
      filteredRecords = filteredRecords.filter(fr => fr.studentId === studentId);
    }
    
    if (status) {
      filteredRecords = filteredRecords.filter(fr => fr.status === status);
    }
    
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredRecords = filteredRecords.filter(fr => 
        fr.Student?.firstName.toLowerCase().includes(searchTerm) ||
        fr.Student?.lastName.toLowerCase().includes(searchTerm) ||
        fr.Student?.admissionNumber.toLowerCase().includes(searchTerm) ||
        fr.FeeStructure?.name.toLowerCase().includes(searchTerm)
      );
    }

    res.json({
      success: true,
      data: filteredRecords,
      pagination: {
        total: filteredRecords.length,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/students/:studentId/fee-records', authorize(RESOURCES.STUDENTS, ACTIONS.READ), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.params;
    const studentFeeRecords = mockFeeRecords.filter(fr => fr.studentId === studentId);

    res.json({
      success: true,
      data: studentFeeRecords,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/students/:studentId/statement', authorize(RESOURCES.STUDENTS, ACTIONS.READ), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId } = req.params;
    const { academicYear } = req.query;
    
    const studentFeeRecords = mockFeeRecords.filter(fr => fr.studentId === studentId);
    const studentPayments = mockPayments.filter(p => p.studentId === studentId);
    
    const totalFees = studentFeeRecords.reduce((sum, fr) => sum + fr.totalAmount, 0);
    const totalPaid = studentFeeRecords.reduce((sum, fr) => sum + fr.paidAmount, 0);
    const totalOutstanding = studentFeeRecords.reduce((sum, fr) => sum + fr.balanceAmount, 0);

    const statement = {
      studentId,
      academicYear: academicYear || "2024",
      totalFees,
      totalPaid,
      totalOutstanding,
      feeRecords: studentFeeRecords,
      payments: studentPayments,
      generatedAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      data: statement,
    });
  } catch (error) {
    next(error);
  }
});

// Payment Management
router.get('/payments', authorize(RESOURCES.STUDENTS, ACTIONS.READ), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, feeStructureId, paymentMethod, status, startDate, endDate } = req.query;
    
    let filteredPayments = [...mockPayments];
    
    if (studentId) {
      filteredPayments = filteredPayments.filter(p => p.studentId === studentId);
    }
    
    if (feeStructureId) {
      filteredPayments = filteredPayments.filter(p => p.feeStructureId === feeStructureId);
    }
    
    if (paymentMethod) {
      filteredPayments = filteredPayments.filter(p => p.paymentMethod === paymentMethod);
    }
    
    if (status) {
      filteredPayments = filteredPayments.filter(p => p.status === status);
    }

    res.json({
      success: true,
      data: filteredPayments,
      pagination: {
        total: filteredPayments.length,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/payments', authorize(RESOURCES.STUDENTS, ACTIONS.CREATE), (req: Request, res: Response, next: NextFunction) => {
  try {
    const receiptNumber = `RCP${String(mockPayments.length + 1).padStart(3, '0')}`;
    
    const newPayment = {
      id: (mockPayments.length + 1).toString(),
      ...req.body,
      receiptNumber,
      status: 'COMPLETED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    mockPayments.push(newPayment);
    
    // Update corresponding fee record
    const feeRecord = mockFeeRecords.find(fr => 
      fr.studentId === newPayment.studentId && 
      fr.feeStructureId === newPayment.feeStructureId
    );
    
    if (feeRecord) {
      feeRecord.paidAmount += newPayment.amount;
      feeRecord.balanceAmount = feeRecord.totalAmount - feeRecord.paidAmount;
      
      if (feeRecord.balanceAmount <= 0) {
        feeRecord.status = 'PAID';
      } else if (feeRecord.paidAmount > 0) {
        feeRecord.status = 'PARTIAL';
      }
      
      feeRecord.updatedAt = new Date().toISOString();
    }

    res.status(201).json({
      success: true,
      data: newPayment,
      message: 'Payment recorded successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Analytics and Reports
router.get('/analytics', authorize(RESOURCES.STUDENTS, ACTIONS.READ), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { academicYear, gradeId, streamId } = req.query;
    
    // Mock analytics data
    const analytics = {
      totalFeesCollected: 2450000,
      totalOutstanding: 350000,
      collectionRate: 87.5,
      totalStudents: 450,
      paidStudents: 394,
      pendingStudents: 56,
      overdueStudents: 12,
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/reports/collection', authorize(RESOURCES.STUDENTS, ACTIONS.READ), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, gradeId } = req.query;
    
    const mockReport = {
      period: { startDate, endDate },
      totalCollected: 450000,
      totalTransactions: 89,
      averageTransaction: 5056,
      collectionByMethod: [
        { method: 'CASH', amount: 200000, count: 40 },
        { method: 'BANK_TRANSFER', amount: 150000, count: 30 },
        { method: 'MOBILE_MONEY', amount: 100000, count: 19 },
      ],
    };

    res.json({
      success: true,
      data: mockReport,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/reports/outstanding', authorize(RESOURCES.STUDENTS, ACTIONS.READ), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gradeId, streamId, daysOverdue } = req.query;
    
    const mockReport = {
      totalOutstanding: 350000,
      totalStudents: 56,
      averageOutstanding: 6250,
      outstandingByGrade: [
        { gradeId: '1', gradeName: 'Grade 1', amount: 70000, students: 12 },
        { gradeId: '2', gradeName: 'Grade 2', amount: 85000, students: 15 },
        { gradeId: '3', gradeName: 'Grade 3', amount: 95000, students: 16 },
        { gradeId: '4', gradeName: 'Grade 4', amount: 100000, students: 13 },
      ],
    };

    res.json({
      success: true,
      data: mockReport,
    });
  } catch (error) {
    next(error);
  }
});

// Fee Reminders
router.get('/reminders', authorize(RESOURCES.STUDENTS, ACTIONS.READ), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, status } = req.query;
    
    const mockReminders = [
      {
        id: "1",
        studentId: "2",
        feeRecordId: "2",
        reminderType: "EMAIL",
        sentAt: "2024-03-01T00:00:00Z",
        status: "SENT",
        message: "Reminder for pending fee payment",
      },
    ];

    res.json({
      success: true,
      data: mockReminders,
      pagination: {
        total: mockReminders.length,
        page: 1,
        limit: 50,
        totalPages: 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/reminders', authorize(RESOURCES.STUDENTS, ACTIONS.CREATE), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentId, feeRecordId, reminderType } = req.body;
    
    const newReminder = {
      id: Date.now().toString(),
      studentId,
      feeRecordId,
      reminderType,
      sentAt: new Date().toISOString(),
      status: "SENT",
      message: "Reminder for pending fee payment",
    };

    res.status(201).json({
      success: true,
      data: newReminder,
      message: 'Reminder sent successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Receipt Generation
router.post('/payments/:paymentId/receipt', authorize(RESOURCES.STUDENTS, ACTIONS.READ), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { paymentId } = req.params;
    
    const payment = mockPayments.find(p => p.id === paymentId);
    if (!payment) {
      res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
      return;
    }

    const receiptUrl = `https://example.com/receipts/${payment.receiptNumber}.pdf`;

    res.json({
      success: true,
      data: { receiptUrl },
      message: 'Receipt generated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Bulk Operations
router.post('/fee-records/bulk', authorize(RESOURCES.STUDENTS, ACTIONS.CREATE), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { feeStructureId, studentIds } = req.body;
    
    const feeStructure = mockFeeStructures.find(fs => fs.id === feeStructureId);
    if (!feeStructure) {
      res.status(404).json({
        success: false,
        message: 'Fee structure not found',
      });
      return;
    }

    const newFeeRecords = studentIds.map((studentId: string, index: number) => ({
      id: (mockFeeRecords.length + index + 1).toString(),
      studentId,
      feeStructureId,
      totalAmount: feeStructure.amount,
      paidAmount: 0,
      balanceAmount: feeStructure.amount,
      status: "PENDING",
      dueDate: feeStructure.dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    mockFeeRecords.push(...newFeeRecords);

    res.status(201).json({
      success: true,
      data: newFeeRecords,
      message: 'Fee records created successfully',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/reminders/bulk', authorize(RESOURCES.STUDENTS, ACTIONS.CREATE), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { studentIds, reminderType } = req.body;
    
    const newReminders = studentIds.map((studentId: string) => ({
      id: Date.now().toString() + Math.random(),
      studentId,
      reminderType,
      sentAt: new Date().toISOString(),
      status: "SENT",
      message: "Bulk reminder for pending fee payment",
    }));

    res.status(201).json({
      success: true,
      data: newReminders,
      message: 'Bulk reminders sent successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Export Functions
router.post('/export', authorize(RESOURCES.STUDENTS, ACTIONS.READ), (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, filters } = req.body;
    
    const downloadUrl = `https://example.com/exports/${type}-${Date.now()}.xlsx`;

    res.json({
      success: true,
      data: { downloadUrl },
      message: 'Export generated successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router; 