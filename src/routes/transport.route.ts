import express from "express";
import passport from "passport";
import {
  // Driver controllers
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
  
  // Vehicle controllers
  getVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  assignVehicleToDriver,
  getAvailableVehicles,
  
  // Booking controllers
  getVehicleBookings,
  getVehicleBooking,
  createVehicleBooking,
  updateVehicleBooking,
  approveVehicleBooking,
  completeVehicleBooking,
  cancelVehicleBooking,
  
  // Maintenance controllers
  getMaintenanceReports,
  getMaintenanceReport,
  createMaintenanceReport,
  updateMaintenanceReport,
  deleteMaintenanceReport,
  
  // Analytics
  getTransportAnalytics,
} from "../controllers/transport.controller";

const router = express.Router();

// Middleware to protect all routes
router.use(passport.authenticate("jwt", { session: false }));

// Driver routes
router.route("/drivers")
  .get(getDrivers)
  .post(createDriver);

router.route("/drivers/:id")
  .get(getDriver)
  .put(updateDriver)
  .delete(deleteDriver);

// Vehicle routes
router.route("/vehicles")
  .get(getVehicles)
  .post(createVehicle);

router.route("/vehicles/available")
  .get(getAvailableVehicles);

router.route("/vehicles/:id")
  .get(getVehicle)
  .put(updateVehicle)
  .delete(deleteVehicle);

router.route("/vehicles/:id/assign")
  .put(assignVehicleToDriver);

// Booking routes
router.route("/bookings")
  .get(getVehicleBookings)
  .post(createVehicleBooking);

router.route("/bookings/:id")
  .get(getVehicleBooking)
  .put(updateVehicleBooking);

router.route("/bookings/:id/approve")
  .put(approveVehicleBooking);

router.route("/bookings/:id/complete")
  .put(completeVehicleBooking);

router.route("/bookings/:id/cancel")
  .put(cancelVehicleBooking);

// Maintenance routes
router.route("/maintenance")
  .get(getMaintenanceReports)
  .post(createMaintenanceReport);

router.route("/maintenance/:id")
  .get(getMaintenanceReport)
  .put(updateMaintenanceReport)
  .delete(deleteMaintenanceReport);

// Analytics routes
router.route("/analytics")
  .get(getTransportAnalytics);

export default router; 