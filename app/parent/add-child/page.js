"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AddChild() {
  const [form, setForm] = useState({
    name: "",
    birthday: "",
    age: "",
    targetLevel: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth");
        const data = await res.json();
        
        if (!data.success || data.data.user.role !== "parent") {
          router.push("/login");
          return;
        }
      } catch (e) {
        router.push("/login");
      }
      setLoading(false);
    };
    
    checkAuth();
  }, [router]);

  const calculateAge = (birthdayValue) => {
    if (!birthdayValue) return "";

    const birthDate = new Date(birthdayValue);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age -= 1;
    }

    return age < 0 ? "" : String(age);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setPageLoading(true);

    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          age: parseInt(form.age),
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to register child");
        setPageLoading(false);
        return;
      }

      setSuccess(true);
      setPageLoading(false);
      
      setTimeout(() => {
        router.push("/parent/children");
      }, 2000);

    } catch (err) {
      setError("Something went wrong. Please try again.");
      setPageLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl bg-green-500/20"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl bg-green-500/20"></div>
        </div>
        <div className="relative text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Child Registered Successfully!</h2>
          <p className="text-white/60">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-900 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl bg-blue-500/20"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl bg-purple-500/20"></div>
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/parent/children" className="text-white/60 hover:text-white mb-4 inline-flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to My Children
          </Link>
          <h1 className="text-3xl font-bold text-white">Register Your Child</h1>
          <p className="text-white/60 mt-2">Add your child to be enrolled in a classroom</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300">
            {error}
          </div>
        )}

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Child's Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 outline-none focus:border-blue-500 transition-all"
                placeholder="Enter child's full name"
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Birthday</label>
                <input
                  type="date"
                  value={form.birthday}
                  onChange={(e) => {
                    const birthday = e.target.value;
                    setForm({
                      ...form,
                      birthday,
                      age: calculateAge(birthday),
                    });
                  }}
                  required
                  className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Age (Auto-calculated)</label>
                <input
                  type="number"
                  value={form.age}
                  required
                  readOnly
                  className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white/80 placeholder-white/40 outline-none"
                  placeholder="Age will auto-fill"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Target Student Level</label>
              <select
                value={form.targetLevel}
                onChange={(e) => setForm({ ...form, targetLevel: e.target.value })}
                required
                className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-blue-500 transition-all"
              >
                <option value="" className="bg-slate-800">Select target level</option>
                <option value="Nursery" className="bg-slate-800">Nursery</option>
                <option value="Kindergarten" className="bg-slate-800">Kindergarten</option>
                <option value="Grade 1" className="bg-slate-800">Grade 1</option>
                <option value="Grade 2" className="bg-slate-800">Grade 2</option>
                <option value="Grade 3" className="bg-slate-800">Grade 3</option>
                <option value="Grade 4" className="bg-slate-800">Grade 4</option>
                <option value="Grade 5" className="bg-slate-800">Grade 5</option>
                <option value="Grade 6" className="bg-slate-800">Grade 6</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Address</label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={3}
                className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 outline-none focus:border-blue-500 transition-all resize-none"
                placeholder="Enter address"
              />
            </div>

            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-blue-300 text-sm">
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Your child will be registered and a teacher will add them to their classroom.
              </p>
            </div>

            <button
              type="submit"
              disabled={pageLoading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
            >
              {pageLoading ? "Registering..." : "Register Child"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
