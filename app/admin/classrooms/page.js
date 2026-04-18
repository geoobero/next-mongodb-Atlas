"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminClassrooms() {
  const [classrooms, setClassrooms] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", gradeLevel: "", adviserId: "", schoolYearId: "" });
  const [selectedYear, setSelectedYear] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth");
        const data = await res.json();
        
        if (!data.success || data.data.user.role !== "admin") {
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
      const [classroomsRes, usersRes, yearsRes] = await Promise.all([
        fetch("/api/classrooms"),
        fetch("/api/users?role=teacher"),
        fetch("/api/school-years")
      ]);
      
      const classroomsData = await classroomsRes.json();
      const usersData = await usersRes.json();
      const yearsData = await yearsRes.json();
      
      if (classroomsData.success) setClassrooms(classroomsData.data.classrooms);
      if (usersData.success) setTeachers(usersData.data.users);
      if (yearsData.success) setSchoolYears(yearsData.data.schoolYears);
      
      const activeYear = yearsData.data.schoolYears.find(y => y.isActive);
      if (activeYear) setSelectedYear(activeYear._id);
      
    } catch (e) {
      console.error("Error fetching data:", e);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to create classroom");
        return;
      }

      setSuccess(true);
      setShowModal(false);
      setForm({ name: "", gradeLevel: "", adviserId: "", schoolYearId: "" });
      fetchData();
      
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  };

  const deleteClassroom = async (id) => {
    if (!confirm("Are you sure you want to delete this classroom?")) return;
    
    try {
      const res = await fetch(`/api/classrooms/${id}`, { method: "DELETE" });
      const data = await res.json();
      
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || "Failed to delete");
      }
    } catch (e) {
      console.error("Error deleting classroom:", e);
    }
  };

  const filteredClassrooms = selectedYear === "all" 
    ? classrooms 
    : classrooms.filter(c => c.schoolYearId?._id === selectedYear);

  const getGradeBadge = (grade) => {
    const colors = {
      "K": "bg-yellow-500/30 text-yellow-300",
      "1": "bg-red-500/30 text-red-300",
      "2": "bg-orange-500/30 text-orange-300",
      "3": "bg-green-500/30 text-green-300",
      "4": "bg-blue-500/30 text-blue-300",
      "5": "bg-purple-500/30 text-purple-300",
      "6": "bg-pink-500/30 text-pink-300",
    };
    return colors[grade] || "bg-white/20 text-white";
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

      <div className="relative max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Classrooms</h1>
            <p className="text-white/60 mt-1">Manage classrooms and assign teachers</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 md:mt-0 inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Classroom
          </button>
        </div>

        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedYear("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              selectedYear === "all"
                ? "bg-white/10 text-white border border-white/20"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            All Years
          </button>
          {schoolYears.map((year) => (
            <button
              key={year._id}
              onClick={() => setSelectedYear(year._id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedYear === year._id
                  ? "bg-white/10 text-white border border-white/20"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              {year.year} {year.isActive && "(Active)"}
            </button>
          ))}
        </div>

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-green-500/20 border border-green-500/30 text-green-300">
            Classroom created successfully!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClassrooms.map((classroom) => (
            <div key={classroom._id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{classroom.name}</h3>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${getGradeBadge(classroom.gradeLevel)}`}>
                    Grade {classroom.gradeLevel}
                  </span>
                </div>
                <button
                  onClick={() => deleteClassroom(classroom._id)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-white/60">
                  <span className="text-white/40">Adviser:</span>{" "}
                  {classroom.adviserId ? (
                    <span className="text-white">{classroom.adviserId.name}</span>
                  ) : (
                    <span className="text-yellow-400">Not assigned</span>
                  )}
                </p>
                <p className="text-sm text-white/60">
                  <span className="text-white/40">School Year:</span>{" "}
                  <span className="text-white">{classroom.schoolYearId?.year || "N/A"}</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {filteredClassrooms.length === 0 && (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
            <p className="text-white/60">No classrooms found. Create one to get started.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Add Classroom</h2>
            
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Classroom Name (e.g., Grade 1-A)</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 outline-none focus:border-blue-500 transition-all"
                  placeholder="Grade 1-A"
                />
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Grade Level</label>
                <select
                  value={form.gradeLevel}
                  onChange={(e) => setForm({ ...form, gradeLevel: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500 transition-all"
                >
                  <option className="bg-slate-700" value="">Select grade</option>
                  <option className="bg-slate-700" value="K">Kindergarten</option>
                  <option className="bg-slate-700" value="1">Grade 1</option>
                  <option className="bg-slate-700" value="2">Grade 2</option>
                  <option className="bg-slate-700" value="3">Grade 3</option>
                  <option className="bg-slate-700" value="4">Grade 4</option>
                  <option className="bg-slate-700" value="5">Grade 5</option>
                  <option className="bg-slate-700" value="6">Grade 6</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">School Year</label>
                <select
                  value={form.schoolYearId}
                  onChange={(e) => setForm({ ...form, schoolYearId: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500 transition-all"
                >
                  <option value="" className="bg-slate-700">Select school year</option>
                  {schoolYears.map((year) => (
                    <option className="bg-slate-700" key={year._id} value={year._id}>{year.year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-white/60 mb-2">Adviser (Optional)</label>
                <select
                  value={form.adviserId}
                  onChange={(e) => setForm({ ...form, adviserId: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500 transition-all"
                >
                  <option value="" className="bg-slate-700">No adviser assigned</option>
                  {teachers.map((teacher) => (
                    <option className="bg-slate-700" key={teacher._id} value={teacher._id}>{teacher.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setError(""); }}
                  className="flex-1 px-4 py-3 border border-white/10 text-white rounded-xl hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
