import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { connectDB, Attendance, Student, Classroom, Notification, SchoolYear } from "../models";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-key-change-in-production";

export async function GET(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectDB();
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const classroomId = searchParams.get("classroomId");
    const date = searchParams.get("date");
    const schoolYearId = searchParams.get("schoolYearId");

    let query = {};

    if (studentId) {
      query.studentId = studentId;
    }

    if (classroomId) {
      query.classroomId = classroomId;
    }

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    if (schoolYearId) {
      query.schoolYearId = schoolYearId;
    } else {
      const activeYear = await SchoolYear.findOne({ isActive: true });
      if (activeYear) {
        query.schoolYearId = activeYear._id;
      }
    }

    if (decoded.role === "parent") {
      const children = await Student.find({ parentId: decoded.id }).select("_id");
      const childIds = children.map(c => c._id);
      query.studentId = { $in: childIds };
    } else if (decoded.role === "teacher") {
      const teacherClassrooms = await Classroom.find({ adviserId: decoded.id }).select("_id");
      const classroomIds = teacherClassrooms.map(c => c._id);
      query.classroomId = { $in: classroomIds };
    }

    const attendance = await Attendance.find(query)
      .populate("studentId", "name")
      .populate("teacherId", "name")
      .populate("classroomId", "name")
      .sort({ date: -1, session: 1 });

    return NextResponse.json({
      success: true,
      data: { attendance }
    });

  } catch (error) {
    console.error("Attendance GET Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectDB();
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.role !== "teacher") {
      return NextResponse.json(
        { success: false, error: "Only teachers can submit attendance" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { records, date, session } = body;

    if (!records || !date || !session) {
      return NextResponse.json(
        { success: false, error: "Records, date, and session are required" },
        { status: 400 }
      );
    }

    if (!["morning", "afternoon"].includes(session)) {
      return NextResponse.json(
        { success: false, error: "Session must be morning or afternoon" },
        { status: 400 }
      );
    }

    const activeYear = await SchoolYear.findOne({ isActive: true });
    if (!activeYear) {
      return NextResponse.json(
        { success: false, error: "No active school year found" },
        { status: 400 }
      );
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const existingRecord = await Attendance.findOne({
      classroomId: records[0]?.classroomId,
      date: attendanceDate,
      session,
      schoolYearId: activeYear._id
    });

    if (existingRecord) {
      return NextResponse.json(
        { success: false, error: "Attendance already submitted for this session. Use edit instead." },
        { status: 400 }
      );
    }

    const createdRecords = [];
    const absentStudents = [];

    for (const record of records) {
      const classroom = await Classroom.findById(record.classroomId);
      if (!classroom || classroom.adviserId?.toString() !== decoded.id) {
        continue;
      }

      const attendance = await Attendance.create({
        studentId: record.studentId,
        teacherId: decoded.id,
        classroomId: record.classroomId,
        schoolYearId: activeYear._id,
        date: attendanceDate,
        session,
        status: record.status || "absent"
      });

      createdRecords.push(attendance);

      if (record.status === "absent") {
        const student = await Student.findById(record.studentId);
        if (student) {
          absentStudents.push({
            studentId: student._id,
            parentId: student.parentId,
            studentName: student.name
          });
        }
      }
    }

    for (const absent of absentStudents) {
      await Notification.create({
        userId: absent.parentId,
        studentId: absent.studentId,
        message: `Your child ${absent.studentName} was marked absent for the ${session} session on ${attendanceDate.toLocaleDateString()}.`,
        type: "absence_reminder"
      });
    }

    return NextResponse.json({
      success: true,
      data: { records: createdRecords, absentCount: absentStudents.length },
      message: `Attendance submitted. ${absentStudents.length} absent students notified.`
    }, { status: 201 });

  } catch (error) {
    console.error("Attendance POST Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
