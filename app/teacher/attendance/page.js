"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TeacherAttendance() {
  const [classrooms, setClassrooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [session, setSession] = useState("morning");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth");
        const data = await res.json();
        
        if (!data.success || data.data.user.role !== "teacher") {
          router.push("/login");
          return;
        }
        
        fetchClassrooms();
      } catch (e) {
        router.push("/login");
      }
    };
    
    checkAuth();
  }, [router]);

  const fetchClassrooms = async () => {
    try {
      const res = await fetch("/api/classrooms");
      const data = await res.json();
      if (data.success) {
        setClassrooms(data.data.classrooms);
        if (data.data.classrooms.length > 0) {
          setSelectedClassroom(data.data.classrooms[0]._id);
        }
      }
    } catch (e) {
      console.error("Error fetching classrooms:", e);
    }
    setLoading(false);
  };

  const fetchStudents = async () => {
    if (!selectedClassroom) return;
    
    try {
      const res = await fetch(`/api/students?classroomId=${selectedClassroom}`);
      const data = await res.json();
      if (data.success) {
        setStudents(data.data.students);
        const initialRecords = {};
        data.data.students.forEach((s) => {
          initialRecords[s._id] = "absent";
        });
        setAttendanceRecords(initialRecords);
      }
    } catch (e) {
      console.error("Error fetching students:", e);
    }
  };

  useEffect(() => {
    if (selectedClassroom) {
      fetchStudents();
    }
  }, [selectedClassroom]);

  const toggleAttendance = (studentId) => {
    setAttendanceRecords((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === "present" ? "absent" : "present",
    }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    
    try {
      const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({
        studentId,
        classroomId: selectedClassroom,
        status,
      }));

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records, date, session }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        alert(data.error || "Failed to submit attendance");
      }
    } catch (e) {
      console.error("Error submitting attendance:", e);
    }
    
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const presentCount = Object.values(attendanceRecords).filter(s => s === "present").length;
  const absentCount = students.length - presentCount;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-900 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl bg-blue-500/20"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl bg-purple-500/20"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Take Attendance</h1>
          <p className="text-white/60 mt-1">Record student attendance for your classes</p>
        </div>

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/20 border border-green-500/30 text-green-300 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Attendance submitted successfully!
          </div>
        )}

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Classroom</label>
              <select
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500"
              >
                <option value="">Select classroom</option>
                {classrooms.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">Session</label>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500"
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
              </select>
            </div>
          </div>
        </div>

        {students.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-white/60">
                <span className="text-green-400 font-medium">{presentCount} Present</span>
                {" | "}
                <span className="text-red-400 font-medium">{absentCount} Absent</span>
              </p>
              <p className="text-white/60 text-sm">Tap student to mark present/absent</p>
            </div>

            <div className="space-y-3 mb-6">
              {students.map((student) => (
                <div
                  key={student._id}
                  onClick={() => toggleAttendance(student._id)}
                  className={`backdrop-blur-xl border rounded-2xl p-4 cursor-pointer transition-all ${
                    attendanceRecords[student._id] === "present"
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        attendanceRecords[student._id] === "present"
                          ? "bg-green-500/30 text-green-300"
                          : "bg-white/10 text-white/50"
                      }`}>
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{student.name}</p>
                        <p className="text-white/50 text-sm">{student.parentId?.name || "Parent"}</p>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      attendanceRecords[student._id] === "present"
                        ? "bg-green-500/30 text-green-300"
                        : "bg-red-500/30 text-red-300"
                    }`}>
                      {attendanceRecords[student._id] === "present" ? "Present" : "Absent"}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Save Attendance"}
            </button>
          </>
        )}

        {students.length === 0 && selectedClassroom && (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-white/60">No students enrolled in this classroom yet.</p>
          </div>
        )}

        {classrooms.length === 0 && (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-white/60">No classrooms assigned to you yet. Contact admin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
