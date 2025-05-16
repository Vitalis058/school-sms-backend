import z from "zod";

//sign up schema
export const SignupSchema = z.object({
  username: z.string().min(3, "minimum of 3 characters"),
  email: z.string().min(1, "email is required").email("Enter a valid email"),
  password: z.string().min(8, "password requires a minimum of 8 characters"),
});

//sign in schema
export const SigninSchema = z.object({
  username: z.string().min(3, "minimum of 3 characters"),
  password: z.string().min(8, "password requires a minimum of 8 characters"),
});

//teacher enrollment schema
export const TeacherEnrollmentSchema = z.object({
  // Personal Information
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }),
  gender: z.enum(["male", "female", "other"], {
    required_error: "Please select a gender",
  }),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number is required"),
  alternatePhone: z.string().optional(),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "ZIP code is required"),

  emergencyContactName: z.string().min(1, "Emergency contact name is required"),
  emergencyContactPhone: z
    .string()
    .min(10, "Emergency contact phone is required"),
  emergencyContactRelationship: z.string().min(1, "Relationship is required"),

  highestQualification: z.string().min(1, "Highest qualification is required"),
  specialization: z.string().min(1, "Specialization is required"),
  teachingExperience: z.string().min(1, "Teaching experience is required"),
  subjects: z.array(z.string()).min(1, "Select at least one subject"),
  gradesCanTeach: z.array(z.string()).min(1, "Select at least one grade"),

  employmentType: z.enum(["full_time", "part_time", "contract"], {
    required_error: "Please select employment type",
  }),
  joiningDate: z.date({
    required_error: "Joining date is required",
  }),
  position: z.string().min(1, "Position is required"),
  department: z.string().min(1, "Department is required"),

  previousEmployments: z.array(
    z.object({
      institution: z.string().min(1, "Institution name is required"),
      position: z.string().min(1, "Position is required"),
      startDate: z.string().min(1, "Start date is required"),
      endDate: z.string().min(1, "end date is required"),
      reasonForLeaving: z.string().min(1, "reason for leaving is required"),
    })
  ),

  certifications: z.string().optional(),
  skills: z.string().optional(),
  languages: z.string().optional(),
  additionalNotes: z.string().optional(),
});

//create grade
export const GradeCreationSchema = z.object({
  name: z.string().min(1, { message: "Class name is required" }),
});

//create stream
export const StreamCreationSchema = z.object({
  name: z.string().min(1, { message: "Stream name is required" }),
  teacherId: z.string().optional(),
  gradeId: z.string().min(1, "A grade is required"),
});

//student enrollment schema
export const StudentEnrollmentSchema = z.object({
  // Personal Info
  firstName: z.string().min(1, { message: "First name is required" }),
  lastName: z.string().min(1, { message: "Last name is required" }),
  dateOfBirth: z.string().min(1, { message: "Date of Birth is required" }),
  gender: z.string().min(1, { message: "Gender is required" }),
  guardianId: z.string().min(1, { message: "guardian is required" }),

  // Contact Info
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),

  // Address Info
  streetAddress: z.string().min(1, "streetAddress or name is required"),
  city: z.string().min(1, { message: "city of residence is required" }),
  state: z.string().min(1, { message: "state is required" }),
  zipCode: z.string().optional(),

  // Academic Info
  admissionNumber: z
    .string()
    .min(1, { message: "Admission number is required" }),
  gradeId: z.string().min(1, { message: "grade is required" }),
  streamId: z.string().min(1, { message: "stream is required" }),
  enrollmentDate: z.string().min(1, { message: "Enrollment date is required" }),
  password: z.string().min(1, "Student password is required"),

  // Optional
  message: z.string().optional(),
});

//parent schema
export const ParentsEnrollmentSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  phone: z.string().min(10, "Phone number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  occupation: z.string().optional().or(z.literal("")),
  dateOfBirth: z.date().optional(),
  educationLevel: z.string().optional().or(z.literal("")),
  preferredContactMethod: z.enum(["phone", "email", "both"]).default("both"),
  notes: z.string().optional().or(z.literal("")),
});

//department schema
export const DepartmentCreationSchema = z.object({
  name: z.string().min(1, { message: "Department name is required" }),
  description: z.string().optional(),
});

//lesson schema
export const lessonSchema = z.object({
  name: z.string().min(1, "Lesson name is required"),
  description: z.string().optional(),
  materials: z.any().optional(), // or use z.record(z.any()) if it's expected to be an object
  assignment: z.any().optional(),
  teacherId: z.string().min(1, "Teacher ID is required"),
  subjectId: z.string().min(1, "Subject ID is required"),
  streamId: z.string().min(1, "Stream ID is required"),
});

//time slot schema

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const timeSlotSchema = z.object({
  name: z.string().min(1, "Slot name is required"),
  startTime: z
    .string()
    .regex(timeRegex, { message: "Invalid time format (expected HH:mm)" }),
  endTime: z
    .string()
    .regex(timeRegex, { message: "Invalid time format (expected HH:mm)" }),
});
