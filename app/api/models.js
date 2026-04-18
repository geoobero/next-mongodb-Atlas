import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }
}

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "teacher", "parent"], default: "parent" },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  age: { type: Number, default: null },
  birthday: { type: Date, default: null },
  profilePicture: { type: String, default: "" },
}, { timestamps: true });

userSchema.index({ role: 1 });

const User = mongoose.models.User || mongoose.model("User", userSchema);

const schoolYearSchema = new mongoose.Schema({
  year: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: false },
}, { timestamps: true });

schoolYearSchema.index({ isActive: 1 });

const SchoolYear = mongoose.models.SchoolYear || mongoose.model("SchoolYear", schoolYearSchema);

const classroomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  gradeLevel: { type: String, required: true },
  adviserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  schoolYearId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolYear", required: true },
}, { timestamps: true });

classroomSchema.index({ schoolYearId: 1 });
classroomSchema.index({ adviserId: 1 });

const Classroom = mongoose.models.Classroom || mongoose.model("Classroom", classroomSchema);

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  birthday: { type: Date, required: true },
  targetLevel: { type: String, default: "" },
  address: { type: String, default: "" },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  classroomId: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", default: null },
  schoolYearId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolYear", required: true },
  status: { type: String, enum: ["pending", "enrolled", "archived"], default: "pending" },
}, { timestamps: true });

studentSchema.index({ parentId: 1 });
studentSchema.index({ classroomId: 1 });
studentSchema.index({ schoolYearId: 1 });
studentSchema.index({ status: 1 });

const Student = mongoose.models.Student || mongoose.model("Student", studentSchema);

const attendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  classroomId: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
  schoolYearId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolYear", required: true },
  date: { type: Date, required: true },
  session: { type: String, enum: ["morning", "afternoon"], required: true },
  status: { type: String, enum: ["present", "absent", "late", "excused"], default: "absent" },
}, { timestamps: true });

attendanceSchema.index({ studentId: 1, date: 1, session: 1 });
attendanceSchema.index({ classroomId: 1, date: 1 });
attendanceSchema.index({ schoolYearId: 1 });

const Attendance = mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", default: null },
  issueReportId: { type: mongoose.Schema.Types.ObjectId, ref: "IssueReport", default: null },
  message: { type: String, required: true },
  type: { type: String, enum: ["enrollment", "absence_reminder", "report_update", "system"], default: "system" },
  read: { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ userId: 1, read: 1 });

const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

const issueReportSchema = new mongoose.Schema({
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subject: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ["open", "in_review", "resolved"], default: "open" },
  replies: {
    type: [
      {
        adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        message: { type: String, required: true, trim: true },
        createdAt: { type: Date, default: Date.now },
      }
    ],
    default: []
  },
  statusHistory: {
    type: [
      {
        status: { type: String, enum: ["open", "in_review", "resolved"], required: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        updatedAt: { type: Date, default: Date.now },
        note: { type: String, default: "" },
      }
    ],
    default: []
  },
}, { timestamps: true });

issueReportSchema.index({ status: 1, createdAt: -1 });
issueReportSchema.index({ parentId: 1, createdAt: -1 });

const IssueReport = mongoose.models.IssueReport || mongoose.model("IssueReport", issueReportSchema);

const feedPostSchema = new mongoose.Schema({
  content: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  isPinned: { type: Boolean, default: false },
}, { timestamps: true });

feedPostSchema.index({ isPinned: 1, createdAt: -1 });

const FeedPost = mongoose.models.FeedPost || mongoose.model("FeedPost", feedPostSchema);

export {
  connectDB,
  User,
  SchoolYear,
  Classroom,
  Student,
  Attendance,
  Notification,
  IssueReport,
  FeedPost
};
