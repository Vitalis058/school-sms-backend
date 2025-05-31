import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "../../generated/prisma";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";

const prisma = new PrismaClient();

// Driver Controllers
export const getDrivers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { search, status, page = 1, pageSize = 10 } = req.query;
  
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  const where: any = {};
  
  if (search) {
    where.OR = [
      { firstName: { contains: search as string, mode: 'insensitive' } },
      { lastName: { contains: search as string, mode: 'insensitive' } },
      { email: { contains: search as string, mode: 'insensitive' } },
      { licenseNumber: { contains: search as string, mode: 'insensitive' } },
    ];
  }
  
  if (status) {
    where.status = status;
  }

  const [drivers, total] = await Promise.all([
    prisma.driver.findMany({
      where,
      skip,
      take,
      include: {
        Vehicle: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.driver.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: drivers,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
    totalPages: Math.ceil(total / Number(pageSize)),
  });
});

export const getDriver = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const driver = await prisma.driver.findUnique({
    where: { id },
    include: {
      Vehicle: true,
      MaintenanceReports: {
        include: { Vehicle: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      VehicleBookings: {
        include: { Vehicle: true, RequestedByUser: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!driver) {
    return next(new AppError("Driver not found", 404));
  }

  res.status(200).json({
    success: true,
    data: driver,
  });
});

export const createDriver = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    licenseNumber,
    licenseExpiry,
    dateOfBirth,
    address,
    emergencyContact,
    emergencyPhone,
    hireDate,
    experience,
    image,
  } = req.body;

  const driver = await prisma.driver.create({
    data: {
      firstName,
      lastName,
      email,
      phone,
      licenseNumber,
      licenseExpiry: new Date(licenseExpiry),
      dateOfBirth: new Date(dateOfBirth),
      address,
      emergencyContact,
      emergencyPhone,
      hireDate: new Date(hireDate),
      experience: Number(experience),
      image,
    },
  });

  res.status(201).json({
    success: true,
    data: driver,
    message: "Driver created successfully",
  });
});

export const updateDriver = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  // Convert date strings to Date objects
  if (updateData.licenseExpiry) {
    updateData.licenseExpiry = new Date(updateData.licenseExpiry);
  }
  if (updateData.dateOfBirth) {
    updateData.dateOfBirth = new Date(updateData.dateOfBirth);
  }
  if (updateData.hireDate) {
    updateData.hireDate = new Date(updateData.hireDate);
  }
  if (updateData.experience) {
    updateData.experience = Number(updateData.experience);
  }

  const driver = await prisma.driver.update({
    where: { id },
    data: updateData,
    include: { Vehicle: true },
  });

  res.status(200).json({
    success: true,
    data: driver,
    message: "Driver updated successfully",
  });
});

export const deleteDriver = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  await prisma.driver.delete({
    where: { id },
  });

  res.status(200).json({
    success: true,
    message: "Driver deleted successfully",
  });
});

// Vehicle Controllers
export const getVehicles = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { search, status, fuelType, page = 1, pageSize = 10 } = req.query;
  
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  const where: any = {};
  
  if (search) {
    where.OR = [
      { make: { contains: search as string, mode: 'insensitive' } },
      { model: { contains: search as string, mode: 'insensitive' } },
      { plateNumber: { contains: search as string, mode: 'insensitive' } },
      { vin: { contains: search as string, mode: 'insensitive' } },
    ];
  }
  
  if (status) {
    where.status = status;
  }
  
  if (fuelType) {
    where.fuelType = fuelType;
  }

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      skip,
      take,
      include: {
        Driver: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.vehicle.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: vehicles,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
    totalPages: Math.ceil(total / Number(pageSize)),
  });
});

export const getVehicle = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      Driver: true,
      MaintenanceReports: {
        include: { Driver: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      VehicleBookings: {
        include: { Driver: true, RequestedByUser: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!vehicle) {
    return next(new AppError("Vehicle not found", 404));
  }

  res.status(200).json({
    success: true,
    data: vehicle,
  });
});

export const createVehicle = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const {
    make,
    model,
    year,
    plateNumber,
    vin,
    color,
    fuelType,
    capacity,
    mileage,
    insuranceExpiry,
    registrationExpiry,
    purchaseDate,
    purchasePrice,
    driverId,
    image,
  } = req.body;

  const vehicle = await prisma.vehicle.create({
    data: {
      make,
      model,
      year: Number(year),
      plateNumber,
      vin,
      color,
      fuelType,
      capacity: Number(capacity),
      mileage: Number(mileage),
      insuranceExpiry: new Date(insuranceExpiry),
      registrationExpiry: new Date(registrationExpiry),
      purchaseDate: new Date(purchaseDate),
      purchasePrice: Number(purchasePrice),
      driverId: driverId || null,
      image,
    },
  });

  res.status(201).json({
    success: true,
    data: vehicle,
    message: "Vehicle created successfully",
  });
});

export const updateVehicle = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  // Convert date strings to Date objects and numbers
  if (updateData.year) updateData.year = Number(updateData.year);
  if (updateData.capacity) updateData.capacity = Number(updateData.capacity);
  if (updateData.mileage) updateData.mileage = Number(updateData.mileage);
  if (updateData.purchasePrice) updateData.purchasePrice = Number(updateData.purchasePrice);
  if (updateData.currentValue) updateData.currentValue = Number(updateData.currentValue);
  if (updateData.insuranceExpiry) updateData.insuranceExpiry = new Date(updateData.insuranceExpiry);
  if (updateData.registrationExpiry) updateData.registrationExpiry = new Date(updateData.registrationExpiry);
  if (updateData.purchaseDate) updateData.purchaseDate = new Date(updateData.purchaseDate);
  if (updateData.lastServiceDate) updateData.lastServiceDate = new Date(updateData.lastServiceDate);
  if (updateData.nextServiceDate) updateData.nextServiceDate = new Date(updateData.nextServiceDate);

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: updateData,
    include: { Driver: true },
  });

  res.status(200).json({
    success: true,
    data: vehicle,
    message: "Vehicle updated successfully",
  });
});

export const deleteVehicle = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  await prisma.vehicle.delete({
    where: { id },
  });

  res.status(200).json({
    success: true,
    message: "Vehicle deleted successfully",
  });
});

export const assignVehicleToDriver = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { driverId } = req.body;

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: { driverId },
    include: { Driver: true },
  });

  res.status(200).json({
    success: true,
    data: vehicle,
    message: "Vehicle assigned to driver successfully",
  });
});

export const getAvailableVehicles = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return next(new AppError("Start date and end date are required", 400));
  }

  // Get vehicles that are not booked during the specified period
  const vehicles = await prisma.vehicle.findMany({
    where: {
      status: 'AVAILABLE',
      VehicleBookings: {
        none: {
          AND: [
            { status: { in: ['PENDING', 'APPROVED'] } },
            {
              OR: [
                {
                  AND: [
                    { startDate: { lte: new Date(endDate as string) } },
                    { endDate: { gte: new Date(startDate as string) } },
                  ],
                },
              ],
            },
          ],
        },
      },
    },
    include: { Driver: true },
    orderBy: { capacity: 'asc' },
  });

  res.status(200).json({
    success: true,
    data: vehicles,
  });
});

// Vehicle Booking Controllers
export const getVehicleBookings = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { search, status, startDate, endDate, vehicleId, driverId, page = 1, pageSize = 10 } = req.query;
  
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  const where: any = {};
  
  if (search) {
    where.OR = [
      { purpose: { contains: search as string, mode: 'insensitive' } },
      { destination: { contains: search as string, mode: 'insensitive' } },
    ];
  }
  
  if (status) {
    where.status = status;
  }
  
  if (vehicleId) {
    where.vehicleId = vehicleId;
  }
  
  if (driverId) {
    where.driverId = driverId;
  }
  
  if (startDate && endDate) {
    where.startDate = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string),
    };
  }

  const [bookings, total] = await Promise.all([
    prisma.vehicleBooking.findMany({
      where,
      skip,
      take,
      include: {
        Vehicle: true,
        Driver: true,
        RequestedByUser: true,
        ApprovedByUser: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.vehicleBooking.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: bookings,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
    totalPages: Math.ceil(total / Number(pageSize)),
  });
});

export const getVehicleBooking = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const booking = await prisma.vehicleBooking.findUnique({
    where: { id },
    include: {
      Vehicle: true,
      Driver: true,
      RequestedByUser: true,
      ApprovedByUser: true,
    },
  });

  if (!booking) {
    return next(new AppError("Booking not found", 404));
  }

  res.status(200).json({
    success: true,
    data: booking,
  });
});

export const createVehicleBooking = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const {
    vehicleId,
    driverId,
    purpose,
    destination,
    startDate,
    endDate,
    startTime,
    endTime,
    passengers,
    notes,
  } = req.body;

  const requestedBy = (req as any).user.id;

  const booking = await prisma.vehicleBooking.create({
    data: {
      vehicleId,
      driverId,
      requestedBy,
      purpose,
      destination,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      startTime,
      endTime,
      passengers: Number(passengers),
      notes,
    },
    include: {
      Vehicle: true,
      Driver: true,
      RequestedByUser: true,
    },
  });

  res.status(201).json({
    success: true,
    data: booking,
    message: "Vehicle booking created successfully",
  });
});

export const updateVehicleBooking = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
  if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
  if (updateData.passengers) updateData.passengers = Number(updateData.passengers);

  const booking = await prisma.vehicleBooking.update({
    where: { id },
    data: updateData,
    include: {
      Vehicle: true,
      Driver: true,
      RequestedByUser: true,
      ApprovedByUser: true,
    },
  });

  res.status(200).json({
    success: true,
    data: booking,
    message: "Booking updated successfully",
  });
});

export const approveVehicleBooking = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { approved, notes } = req.body;
  const approvedBy = (req as any).user.id;

  const booking = await prisma.vehicleBooking.update({
    where: { id },
    data: {
      status: approved ? 'APPROVED' : 'REJECTED',
      approvedBy,
      approvalDate: new Date(),
      notes: notes || null,
    },
    include: {
      Vehicle: true,
      Driver: true,
      RequestedByUser: true,
      ApprovedByUser: true,
    },
  });

  res.status(200).json({
    success: true,
    data: booking,
    message: `Booking ${approved ? 'approved' : 'rejected'} successfully`,
  });
});

export const completeVehicleBooking = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { mileageEnd, fuelUsed, notes } = req.body;

  const booking = await prisma.vehicleBooking.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      mileageEnd: Number(mileageEnd),
      fuelUsed: fuelUsed ? Number(fuelUsed) : null,
      notes,
    },
    include: {
      Vehicle: true,
      Driver: true,
      RequestedByUser: true,
      ApprovedByUser: true,
    },
  });

  // Update vehicle mileage
  if (mileageEnd) {
    await prisma.vehicle.update({
      where: { id: booking.vehicleId },
      data: { mileage: Number(mileageEnd) },
    });
  }

  res.status(200).json({
    success: true,
    data: booking,
    message: "Booking completed successfully",
  });
});

export const cancelVehicleBooking = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { reason } = req.body;

  const booking = await prisma.vehicleBooking.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      notes: reason,
    },
    include: {
      Vehicle: true,
      Driver: true,
      RequestedByUser: true,
      ApprovedByUser: true,
    },
  });

  res.status(200).json({
    success: true,
    data: booking,
    message: "Booking cancelled successfully",
  });
});

// Maintenance Controllers
export const getMaintenanceReports = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { search, status, type, priority, vehicleId, driverId, page = 1, pageSize = 10 } = req.query;
  
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  const where: any = {};
  
  if (search) {
    where.OR = [
      { title: { contains: search as string, mode: 'insensitive' } },
      { description: { contains: search as string, mode: 'insensitive' } },
      { serviceProvider: { contains: search as string, mode: 'insensitive' } },
    ];
  }
  
  if (status) where.status = status;
  if (type) where.type = type;
  if (priority) where.priority = priority;
  if (vehicleId) where.vehicleId = vehicleId;
  if (driverId) where.driverId = driverId;

  const [reports, total] = await Promise.all([
    prisma.maintenanceReport.findMany({
      where,
      skip,
      take,
      include: {
        Vehicle: true,
        Driver: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.maintenanceReport.count({ where }),
  ]);

  res.status(200).json({
    success: true,
    data: reports,
    total,
    page: Number(page),
    pageSize: Number(pageSize),
    totalPages: Math.ceil(total / Number(pageSize)),
  });
});

export const getMaintenanceReport = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const report = await prisma.maintenanceReport.findUnique({
    where: { id },
    include: {
      Vehicle: true,
      Driver: true,
    },
  });

  if (!report) {
    return next(new AppError("Maintenance report not found", 404));
  }

  res.status(200).json({
    success: true,
    data: report,
  });
});

export const createMaintenanceReport = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const {
    vehicleId,
    type,
    title,
    description,
    serviceDate,
    cost,
    serviceProvider,
    mileageAtService,
    nextServiceDue,
    partsReplaced,
    priority,
    attachments,
  } = req.body;

  const driverId = (req as any).user.id; // Assuming the driver is creating the report

  const report = await prisma.maintenanceReport.create({
    data: {
      vehicleId,
      driverId,
      type,
      title,
      description,
      serviceDate: new Date(serviceDate),
      cost: Number(cost),
      serviceProvider,
      mileageAtService: Number(mileageAtService),
      nextServiceDue: nextServiceDue ? new Date(nextServiceDue) : null,
      partsReplaced: partsReplaced || [],
      priority,
      attachments: attachments || [],
    },
    include: {
      Vehicle: true,
      Driver: true,
    },
  });

  res.status(201).json({
    success: true,
    data: report,
    message: "Maintenance report created successfully",
  });
});

export const updateMaintenanceReport = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  if (updateData.serviceDate) updateData.serviceDate = new Date(updateData.serviceDate);
  if (updateData.nextServiceDue) updateData.nextServiceDue = new Date(updateData.nextServiceDue);
  if (updateData.cost) updateData.cost = Number(updateData.cost);
  if (updateData.mileageAtService) updateData.mileageAtService = Number(updateData.mileageAtService);

  const report = await prisma.maintenanceReport.update({
    where: { id },
    data: updateData,
    include: {
      Vehicle: true,
      Driver: true,
    },
  });

  res.status(200).json({
    success: true,
    data: report,
    message: "Maintenance report updated successfully",
  });
});

export const deleteMaintenanceReport = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  await prisma.maintenanceReport.delete({
    where: { id },
  });

  res.status(200).json({
    success: true,
    message: "Maintenance report deleted successfully",
  });
});

// Analytics
export const getTransportAnalytics = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const [
    totalVehicles,
    availableVehicles,
    vehiclesInUse,
    vehiclesInMaintenance,
    totalDrivers,
    activeDrivers,
    totalBookings,
    pendingBookings,
    completedBookings,
  ] = await Promise.all([
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { status: 'AVAILABLE' } }),
    prisma.vehicle.count({ where: { status: 'IN_USE' } }),
    prisma.vehicle.count({ where: { status: 'MAINTENANCE' } }),
    prisma.driver.count(),
    prisma.driver.count({ where: { status: 'ACTIVE' } }),
    prisma.vehicleBooking.count(),
    prisma.vehicleBooking.count({ where: { status: 'PENDING' } }),
    prisma.vehicleBooking.count({ where: { status: 'COMPLETED' } }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalVehicles,
      availableVehicles,
      vehiclesInUse,
      vehiclesInMaintenance,
      totalDrivers,
      activeDrivers,
      totalBookings,
      pendingBookings,
      completedBookings,
    },
  });
}); 