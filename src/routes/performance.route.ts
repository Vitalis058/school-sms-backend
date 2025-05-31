import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../utils/middleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Mock performance data
const mockPerformanceData = {
  classOverview: {
    totalStudents: 45,
    averageScore: 78.5,
    previousAverage: 75.2,
    trend: "UP",
    trendPercentage: 4.4,
    passRate: 87,
    attendanceRate: 92,
  },
  topPerformers: [
    { id: "1", name: "Alice Johnson", average: 95.2, trend: "UP", trendValue: 2.1 },
    { id: "2", name: "Bob Smith", average: 93.8, trend: "UP", trendValue: 1.5 },
    { id: "3", name: "Carol Davis", average: 91.5, trend: "STABLE", trendValue: 0.2 },
  ],
  needsAttention: [
    { id: "4", name: "David Wilson", average: 45.2, trend: "DOWN", trendValue: -5.3 },
    { id: "5", name: "Eva Brown", average: 48.7, trend: "DOWN", trendValue: -2.8 },
    { id: "6", name: "Frank Miller", average: 52.1, trend: "UP", trendValue: 3.2 },
  ],
  subjectPerformance: [
    { subject: "Mathematics", average: 82.3, previous: 79.1, trend: "UP", students: 45 },
    { subject: "English", average: 78.9, previous: 80.2, trend: "DOWN", students: 45 },
    { subject: "Science", average: 75.6, previous: 74.8, trend: "UP", students: 45 },
    { subject: "History", average: 81.2, previous: 81.0, trend: "STABLE", students: 45 },
    { subject: "Geography", average: 77.4, previous: 75.9, trend: "UP", students: 45 },
  ],
  trendData: [
    { month: "Jan", average: 72.5 },
    { month: "Feb", average: 74.2 },
    { month: "Mar", average: 75.8 },
    { month: "Apr", average: 77.1 },
    { month: "May", average: 78.5 },
  ],
  gradeDistribution: [
    { grade: "A", count: 12, percentage: 26.7 },
    { grade: "B", count: 18, percentage: 40.0 },
    { grade: "C", count: 10, percentage: 22.2 },
    { grade: "D", count: 4, percentage: 8.9 },
    { grade: "F", count: 1, percentage: 2.2 },
  ],
};

// Helper function to handle class performance logic
const handleClassPerformance = (req: Request, res: Response) => {
  try {
    const { gradeId, streamId } = req.params;
    
    res.json({
      success: true,
      data: {
        gradeId,
        grade: { id: gradeId, name: `Grade ${gradeId}` },
        streamId: streamId || 'all',
        stream: streamId ? { id: streamId, name: `Stream ${streamId}` } : null,
        totalStudents: mockPerformanceData.classOverview.totalStudents,
        averageScore: mockPerformanceData.classOverview.averageScore,
        previousAverageScore: mockPerformanceData.classOverview.previousAverage,
        trend: mockPerformanceData.classOverview.trend,
        trendPercentage: mockPerformanceData.classOverview.trendPercentage,
        topPerformers: mockPerformanceData.topPerformers,
        needsAttention: mockPerformanceData.needsAttention,
        subjectStats: mockPerformanceData.subjectPerformance.map(s => ({
          subjectId: s.subject.toLowerCase().replace(/\s+/g, '-'),
          subject: { id: s.subject.toLowerCase().replace(/\s+/g, '-'), name: s.subject },
          averageScore: s.average,
          previousAverageScore: s.previous,
          trend: s.trend,
          trendPercentage: ((s.average - s.previous) / s.previous) * 100,
          passRate: Math.floor(Math.random() * 20) + 80,
          highestScore: Math.floor(Math.random() * 10) + 90,
          lowestScore: Math.floor(Math.random() * 30) + 40
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class performance',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Helper function to handle class students performance logic
const handleClassStudentsPerformance = (req: Request, res: Response) => {
  try {
    const { gradeId, streamId } = req.params;
    
    // Generate mock student performance data
    const students = Array.from({ length: 20 }, (_, i) => ({
      studentId: `student-${i + 1}`,
      student: { 
        id: `student-${i + 1}`, 
        firstName: `Student${i + 1}`, 
        lastName: "Doe" 
      },
      overallAverage: Math.floor(Math.random() * 40) + 60,
      previousAverage: Math.floor(Math.random() * 40) + 55,
      trend: Math.random() > 0.5 ? "UP" : Math.random() > 0.25 ? "DOWN" : "STABLE",
      trendPercentage: (Math.random() - 0.5) * 10,
      subjectPerformances: mockPerformanceData.subjectPerformance.map(s => ({
        subjectId: s.subject.toLowerCase().replace(/\s+/g, '-'),
        subject: { id: s.subject.toLowerCase().replace(/\s+/g, '-'), name: s.subject },
        currentAverage: Math.floor(Math.random() * 40) + 60,
        previousAverage: Math.floor(Math.random() * 40) + 55,
        trend: Math.random() > 0.5 ? "UP" : Math.random() > 0.25 ? "DOWN" : "STABLE",
        trendPercentage: (Math.random() - 0.5) * 10,
        assessmentCount: Math.floor(Math.random() * 5) + 3,
        lastAssessmentDate: "2024-05-15",
        grade: "B"
      })),
      classRank: i + 1,
      totalStudents: 45,
      attendanceRate: Math.floor(Math.random() * 20) + 80,
      improvementAreas: ["Mathematics"],
      strengths: ["English"]
    }));
    
    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch class students performance',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get performance summary
router.get('/summary', authorize('performance', 'read'), (req: Request, res: Response) => {
  try {
    const { gradeId, streamId } = req.query;
    
    res.json({
      success: true,
      data: {
        totalStudents: mockPerformanceData.classOverview.totalStudents,
        averagePerformance: mockPerformanceData.classOverview.averageScore,
        performanceTrend: mockPerformanceData.classOverview.trend,
        trendPercentage: mockPerformanceData.classOverview.trendPercentage,
        topPerformers: mockPerformanceData.topPerformers.map(p => ({
          studentId: p.id,
          studentName: p.name,
          average: p.average
        })),
        needsAttention: mockPerformanceData.needsAttention.map(p => ({
          studentId: p.id,
          studentName: p.name,
          average: p.average
        })),
        subjectPerformance: mockPerformanceData.subjectPerformance.map(s => ({
          subjectId: s.subject.toLowerCase().replace(/\s+/g, '-'),
          subjectName: s.subject,
          average: s.average,
          trend: s.trend
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance summary',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get student performance
router.get('/student/:studentId', authorize('performance', 'read'), (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    
    res.json({
      success: true,
      data: [{
        studentId,
        student: { id: studentId, firstName: "John", lastName: "Doe" },
        overallAverage: 78.5,
        previousAverage: 75.2,
        trend: "UP",
        trendPercentage: 4.4,
        subjectPerformances: mockPerformanceData.subjectPerformance.map(s => ({
          subjectId: s.subject.toLowerCase().replace(/\s+/g, '-'),
          subject: { id: s.subject.toLowerCase().replace(/\s+/g, '-'), name: s.subject },
          currentAverage: s.average,
          previousAverage: s.previous,
          trend: s.trend,
          trendPercentage: ((s.average - s.previous) / s.previous) * 100,
          assessmentCount: 5,
          lastAssessmentDate: "2024-05-15",
          grade: s.average >= 90 ? "A" : s.average >= 80 ? "B" : s.average >= 70 ? "C" : s.average >= 60 ? "D" : "F"
        })),
        classRank: 15,
        totalStudents: 45,
        attendanceRate: 92,
        improvementAreas: ["Mathematics", "Science"],
        strengths: ["English", "History"]
      }]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch student performance',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get class performance - without stream
router.get('/class/:gradeId', authorize('performance', 'read'), handleClassPerformance);

// Get class performance - with stream
router.get('/class/:gradeId/:streamId', authorize('performance', 'read'), handleClassPerformance);

// Get class students performance - without stream
router.get('/class/:gradeId/students', authorize('performance', 'read'), handleClassStudentsPerformance);

// Get class students performance - with stream
router.get('/class/:gradeId/:streamId/students', authorize('performance', 'read'), handleClassStudentsPerformance);

// Get performance trends
router.get('/trends', authorize('performance', 'read'), (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        overallTrend: mockPerformanceData.trendData,
        subjectTrends: mockPerformanceData.subjectPerformance.map(s => ({
          subjectId: s.subject.toLowerCase().replace(/\s+/g, '-'),
          subject: s.subject,
          trend: mockPerformanceData.trendData.map(t => ({
            period: t.month,
            average: t.average + (Math.random() - 0.5) * 10
          }))
        })),
        classComparison: [
          { gradeId: "grade-1", streamId: "stream-a", average: 78.5, trend: "UP" },
          { gradeId: "grade-1", streamId: "stream-b", average: 76.2, trend: "DOWN" },
          { gradeId: "grade-2", streamId: "stream-a", average: 82.1, trend: "UP" },
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance trends',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Add performance record
router.post('/', authorize('performance', 'create'), (req: Request, res: Response) => {
  try {
    const performanceData = req.body;
    
    // Mock response for adding performance record
    res.status(201).json({
      success: true,
      data: {
        id: `perf-${Date.now()}`,
        ...performanceData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add performance record',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Update performance record
router.put('/:id', authorize('performance', 'update'), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    res.json({
      success: true,
      data: {
        id,
        ...updateData,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update performance record',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete performance record
router.delete('/:id', authorize('performance', 'delete'), (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    res.json({
      success: true,
      message: 'Performance record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete performance record',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 