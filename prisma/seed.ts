import { PrismaClient } from '../generated/prisma';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const users = [
    {
      username: 'admin',
      email: 'admin@school.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN' as const,
      password: 'admin123',
    },
    {
      username: 'teacher1',
      email: 'teacher@school.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'TEACHER' as const,
      password: 'teacher123',
    },
    {
      username: 'staff1',
      email: 'staff@school.com',
      firstName: 'Mike',
      lastName: 'Wilson',
      role: 'STAFF' as const,
      password: 'staff123',
    },
    {
      username: 'teacher2',
      email: 'john.doe@school.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'TEACHER' as const,
      password: 'teacher123',
    },
    {
      username: 'staff2',
      email: 'jane.smith@school.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'STAFF' as const,
      password: 'staff123',
    },
    {
      username: 'driver1',
      email: 'driver1@school.com',
      firstName: 'Robert',
      lastName: 'Brown',
      role: 'DRIVER' as const,
      password: 'driver123',
    },
    {
      username: 'driver2',
      email: 'driver2@school.com',
      firstName: 'David',
      lastName: 'Garcia',
      role: 'DRIVER' as const,
      password: 'driver123',
    },
  ];

  for (const userData of users) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        password: hashedPassword,
        isActive: true,
      },
    });

    console.log(`✅ Created user: ${user.email} (${user.role})`);
  }

  // Create some sample leave requests
  const leaveRequests = [
    {
      userId: 2, // teacher@school.com
      leaveType: 'SICK' as const,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-01-17'),
      reason: 'Flu symptoms and need rest',
      status: 'PENDING' as const,
    },
    {
      userId: 3, // staff@school.com
      leaveType: 'ANNUAL' as const,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-02-05'),
      reason: 'Family vacation',
      status: 'APPROVED' as const,
      approvedBy: 1,
      approvedDate: new Date(),
    },
    {
      userId: 4, // john.doe@school.com
      leaveType: 'PERSONAL' as const,
      startDate: new Date('2024-01-20'),
      endDate: new Date('2024-01-22'),
      reason: 'Personal matters',
      status: 'REJECTED' as const,
      approvedBy: 1,
      approvedDate: new Date(),
      rejectionReason: 'Insufficient notice period',
    },
  ];

  for (const leaveData of leaveRequests) {
    const leaveRequest = await prisma.leaveRequest.create({
      data: leaveData,
    });

    console.log(`✅ Created leave request: ${leaveRequest.leaveType} for user ${leaveRequest.userId}`);
  }

  // Create sample drivers
  const drivers = [
    {
      firstName: 'Robert',
      lastName: 'Brown',
      email: 'driver1@school.com',
      phone: '+1-555-0101',
      licenseNumber: 'DL123456789',
      licenseExpiry: new Date('2025-12-31'),
      dateOfBirth: new Date('1980-05-15'),
      address: '123 Driver St, City, State 12345',
      emergencyContact: 'Mary Brown',
      emergencyPhone: '+1-555-0102',
      hireDate: new Date('2023-01-15'),
      experience: 8,
      status: 'ACTIVE' as const,
    },
    {
      firstName: 'David',
      lastName: 'Garcia',
      email: 'driver2@school.com',
      phone: '+1-555-0201',
      licenseNumber: 'DL987654321',
      licenseExpiry: new Date('2026-06-30'),
      dateOfBirth: new Date('1975-09-22'),
      address: '456 Transport Ave, City, State 12345',
      emergencyContact: 'Lisa Garcia',
      emergencyPhone: '+1-555-0202',
      hireDate: new Date('2022-08-01'),
      experience: 12,
      status: 'ACTIVE' as const,
    },
    {
      firstName: 'Michael',
      lastName: 'Johnson',
      email: 'driver3@school.com',
      phone: '+1-555-0301',
      licenseNumber: 'DL456789123',
      licenseExpiry: new Date('2024-03-15'),
      dateOfBirth: new Date('1985-12-10'),
      address: '789 Fleet Rd, City, State 12345',
      emergencyContact: 'Sarah Johnson',
      emergencyPhone: '+1-555-0302',
      hireDate: new Date('2023-06-01'),
      experience: 5,
      status: 'ON_LEAVE' as const,
    },
  ];

  for (const driverData of drivers) {
    const driver = await prisma.driver.create({
      data: driverData,
    });

    console.log(`✅ Created driver: ${driver.firstName} ${driver.lastName}`);
  }

  // Create sample vehicles
  const vehicles = [
    {
      make: 'Ford',
      model: 'Transit',
      year: 2022,
      plateNumber: 'SCH-001',
      vin: '1FTBW2CM6NKA12345',
      color: 'White',
      fuelType: 'DIESEL' as const,
      capacity: 15,
      mileage: 25000,
      insuranceExpiry: new Date('2024-12-31'),
      registrationExpiry: new Date('2024-11-30'),
      purchaseDate: new Date('2022-01-15'),
      purchasePrice: 45000,
      status: 'AVAILABLE' as const,
    },
    {
      make: 'Mercedes',
      model: 'Sprinter',
      year: 2023,
      plateNumber: 'SCH-002',
      vin: 'WD3PE8CC5NP123456',
      color: 'Blue',
      fuelType: 'DIESEL' as const,
      capacity: 20,
      mileage: 15000,
      insuranceExpiry: new Date('2025-01-31'),
      registrationExpiry: new Date('2025-01-15'),
      purchaseDate: new Date('2023-02-01'),
      purchasePrice: 55000,
      status: 'AVAILABLE' as const,
    },
    {
      make: 'Toyota',
      model: 'Hiace',
      year: 2021,
      plateNumber: 'SCH-003',
      vin: 'JTFHZ3LA5MJ123789',
      color: 'Silver',
      fuelType: 'PETROL' as const,
      capacity: 12,
      mileage: 35000,
      insuranceExpiry: new Date('2024-08-31'),
      registrationExpiry: new Date('2024-07-31'),
      purchaseDate: new Date('2021-03-10'),
      purchasePrice: 38000,
      status: 'MAINTENANCE' as const,
    },
    {
      make: 'Nissan',
      model: 'NV200',
      year: 2023,
      plateNumber: 'SCH-004',
      vin: 'JN1BJ0RR5NW123456',
      color: 'Red',
      fuelType: 'PETROL' as const,
      capacity: 8,
      mileage: 8000,
      insuranceExpiry: new Date('2025-03-31'),
      registrationExpiry: new Date('2025-02-28'),
      purchaseDate: new Date('2023-04-01'),
      purchasePrice: 32000,
      status: 'AVAILABLE' as const,
    },
  ];

  const createdVehicles = [];
  for (const vehicleData of vehicles) {
    const vehicle = await prisma.vehicle.create({
      data: vehicleData,
    });
    createdVehicles.push(vehicle);
    console.log(`✅ Created vehicle: ${vehicle.make} ${vehicle.model} (${vehicle.plateNumber})`);
  }

  // Assign vehicles to drivers
  const createdDrivers = await prisma.driver.findMany();
  if (createdDrivers.length > 0 && createdVehicles.length > 0) {
    // Assign first vehicle to first driver
    await prisma.vehicle.update({
      where: { id: createdVehicles[0].id },
      data: { driverId: createdDrivers[0].id },
    });
    console.log(`✅ Assigned ${createdVehicles[0].plateNumber} to ${createdDrivers[0].firstName} ${createdDrivers[0].lastName}`);

    // Assign second vehicle to second driver
    if (createdDrivers.length > 1 && createdVehicles.length > 1) {
      await prisma.vehicle.update({
        where: { id: createdVehicles[1].id },
        data: { driverId: createdDrivers[1].id },
      });
      console.log(`✅ Assigned ${createdVehicles[1].plateNumber} to ${createdDrivers[1].firstName} ${createdDrivers[1].lastName}`);
    }
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 