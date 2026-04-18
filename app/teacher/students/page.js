"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

export default function TeacherStudents() {
  const [myStudents, setMyStudents] = useState([]);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const router = useRouter();

  const normalizeText = (value = "") => value.toLowerCase().replace(/\s+/g, " ").trim();

  const normalizeLevelKey = (value = "") => {
    const text = normalizeText(value);
    if (!text) return "";

    if (text.includes("nursery")) return "nursery";
    if (text === "k" || text === "kg" || text.includes("kindergarten")) return "kindergarten";

    const gradeMatch = text.match(/grade\s*(\d+)/i);
    if (gradeMatch) return `grade ${gradeMatch[1]}`;

    const numberOnlyMatch = text.match(/^([1-6])$/);
    if (numberOnlyMatch) return `grade ${numberOnlyMatch[1]}`;

    const numberInNameMatch = text.match(/\b([1-6])\b/);
    if (numberInNameMatch) return `grade ${numberInNameMatch[1]}`;

    return text;
  };

  const teacherLevelKeys = useMemo(() => {
    const keys = classrooms
      .map((classroom) => {
        const fromGrade = normalizeLevelKey(classroom.gradeLevel || "");
        if (fromGrade) return fromGrade;
        return normalizeLevelKey(classroom.name || "");
      })
      .filter(Boolean);

    return new Set(keys);
  }, [classrooms]);

  const { priorityStudents, nonPriorityStudents } = useMemo(() => {
    const keyword = studentSearch.trim().toLowerCase();

    const filtered = pendingStudents
      .filter((student) => student.name.toLowerCase().includes(keyword))
      .sort((a, b) => a.name.localeCompare(b.name));

    const priority = [];
    const nonPriority = [];

    for (const student of filtered) {
      const studentLevel = normalizeLevelKey(student.targetLevel || "");
      const isPriority = studentLevel && teacherLevelKeys.has(studentLevel);

      if (isPriority) {
        priority.push(student);
      } else {
        nonPriority.push(student);
      }
    }

    return {
      priorityStudents: priority,
      nonPriorityStudents: nonPriority,
    };
  }, [pendingStudents, studentSearch, teacherLevelKeys]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth");
        const data = await res.json();
        
        if (!data.success || data.data.user.role !== "teacher") {
          router.push("/login");
          return;
        }
        
        fetchData();
      } catch (e) {
        router.push("/login");
      }
    };
    
    checkAuth();
  }, [router]);

  const fetchData = async () => {
    try {
      const [studentsRes, pendingRes, classroomsRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/students/pending"),
        fetch("/api/classrooms")
      ]);
      
      const studentsData = await studentsRes.json();
      const pendingData = await pendingRes.json();
      const classroomsData = await classroomsRes.json();
      
      if (studentsData.success) setMyStudents(studentsData.data.students);
      if (pendingData.success) setPendingStudents(pendingData.data.students);
      if (classroomsData.success) setClassrooms(classroomsData.data.classrooms);
      
    } catch (e) {
      console.error("Error fetching data:", e);
    }
    setLoading(false);
  };

  const enrollStudent = async (studentId, classroomId) => {
    setEnrolling(true);
    try {
      const res = await fetch(`/api/students/${studentId}/enroll`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classroomId }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        fetchData();
        setShowPendingModal(false);
        setStudentSearch("");
      } else {
        alert(data.error || "Failed to enroll student");
      }
    } catch (e) {
      console.error("Error enrolling student:", e);
    }
    setEnrolling(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-900 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl bg-blue-500/20"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl bg-purple-500/20"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Students</h1>
            <p className="text-white/60 mt-1">Manage your enrolled students</p>
          </div>
          {pendingStudents.length > 0 && (
            <button
              onClick={() => setShowPendingModal(true)}
              className="mt-4 md:mt-0 inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Enroll Student ({pendingStudents.length})
            </button>
          )}
        </div>

        <div className="space-y-4">
          {myStudents.map((student) => (
            <div key={student._id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{student.name}</h3>
                  <p className="text-white/60 text-sm">
                    Age: {student.age} | Classroom: {student.classroomId?.name || "Not assigned"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white/40 text-xs">
                    {student.parentId?.name || "Parent"}
                  </p>
                  <p className="text-white/60 text-sm">
                    {student.parentId?.phone || "No phone"}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {myStudents.length === 0 && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Students Yet</h3>
              <p className="text-white/60">
                {pendingStudents.length > 0 
                  ? "You have pending students waiting to be enrolled"
                  : "No students available for enrollment"
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {showPendingModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl w-full max-w-4xl p-6 max-h-[85vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-white mb-4">Enroll Pending Student</h2>
            <p className="text-white/60 text-sm mb-4">Select a student and your classroom to enroll them.</p>

            <div className="mb-4">
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search student name"
                className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white placeholder-white/40 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="mb-3 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm">
              Priority is based on your classroom grade level matching the student&apos;s target level.
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-green-300">Priority Students</h3>
                <span className="text-xs text-white/50">{priorityStudents.length}</span>
              </div>

              {priorityStudents.map((student) => (
                <div key={student._id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white font-bold">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{student.name}</p>
                      <p className="text-white/50 text-sm">
                        Age: {student.age} | Parent: {student.parentId?.name}
                      </p>
                      <p className="text-green-300 text-sm">Target Level: {student.targetLevel || "Not set"}</p>
                    </div>
                  </div>
                  
                  <select
                    id={`classroom-${student._id}`}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm outline-none focus:border-blue-500"
                  >
                    <option value="" className="bg-slate-700">Select your classroom</option>
                    {classrooms.map((c) => (
                      <option className="bg-slate-700" key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                  
                  <button
                    onClick={() => {
                      const classroomId = document.getElementById(`classroom-${student._id}`).value;
                      if (classroomId) {
                        enrollStudent(student._id, classroomId);
                      } else {
                        alert("Please select a classroom");
                      }
                    }}
                    disabled={enrolling}
                    className="w-full mt-3 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {enrolling ? "Enrolling..." : "Enroll Student"}
                  </button>
                </div>
              ))}

              {priorityStudents.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-white/60 text-sm">
                  No priority students found.
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-yellow-300">Other Pending Students</h3>
                <span className="text-xs text-white/50">{nonPriorityStudents.length}</span>
              </div>

              {nonPriorityStudents.map((student) => (
                <div key={student._id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-500 to-slate-600 flex items-center justify-center text-white font-bold">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-medium">{student.name}</p>
                      <p className="text-white/50 text-sm">
                        Age: {student.age} | Parent: {student.parentId?.name}
                      </p>
                      <p className="text-yellow-300 text-sm">Target Level: {student.targetLevel || "Not set"}</p>
                    </div>
                  </div>

                  <select
                    id={`classroom-${student._id}`}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm outline-none focus:border-blue-500"
                  >
                    <option value="" className="bg-slate-700">Select your classroom</option>
                    {classrooms.map((c) => (
                      <option className="bg-slate-700" key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      const classroomId = document.getElementById(`classroom-${student._id}`).value;
                      if (classroomId) {
                        enrollStudent(student._id, classroomId);
                      } else {
                        alert("Please select a classroom");
                      }
                    }}
                    disabled={enrolling}
                    className="w-full mt-3 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {enrolling ? "Enrolling..." : "Enroll Student"}
                  </button>
                </div>
              ))}

              {priorityStudents.length === 0 && nonPriorityStudents.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-white/60 text-sm">
                  No pending students found for your search.
                </div>
              )}
            </div>
            
            <button
              onClick={() => {
                setShowPendingModal(false);
                setStudentSearch("");
              }}
              className="w-full mt-4 px-4 py-3 border border-white/10 text-white rounded-xl hover:bg-white/5 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
