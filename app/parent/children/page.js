"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MyChildren() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
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
        
        fetchChildren();
      } catch (e) {
        router.push("/login");
      }
    };
    
    checkAuth();
  }, [router]);

  const fetchChildren = async () => {
    try {
      const res = await fetch("/api/students");
      const data = await res.json();
      if (data.success) {
        setChildren(data.data.students);
      }
    } catch (e) {
      console.error("Error fetching children:", e);
    }
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="px-2.5 py-1 text-xs rounded-full bg-yellow-500/30 text-yellow-300 border border-yellow-500/30">Pending</span>;
      case "enrolled":
        return <span className="px-2.5 py-1 text-xs rounded-full bg-green-500/30 text-green-300 border border-green-500/30">Enrolled</span>;
      case "archived":
        return <span className="px-2.5 py-1 text-xs rounded-full bg-gray-500/30 text-gray-300 border border-gray-500/30">Archived</span>;
      default:
        return <span className="px-2.5 py-1 text-xs rounded-full bg-white/20 text-white">{status}</span>;
    }
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
            <h1 className="text-3xl font-bold text-white">My Children</h1>
            <p className="text-white/60 mt-1">View your registered children</p>
          </div>
          <Link
            href="/parent/add-child"
            className="mt-4 md:mt-0 inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Child
          </Link>
        </div>

        <div className="space-y-4">
          {children.map((child) => (
            <div key={child._id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
                    {child.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-bold text-white">{child.name}</h3>
                      {getStatusBadge(child.status)}
                    </div>
                    <p className="text-white/60 text-sm mt-1">
                      Age: {child.age} | Birthday: {new Date(child.birthday).toLocaleDateString()}
                    </p>
                    {child.targetLevel && (
                      <p className="text-white/60 text-sm">
                        Target Level: <span className="text-white">{child.targetLevel}</span>
                      </p>
                    )}
                    {child.classroomId && (
                      <p className="text-white/60 text-sm">
                        Classroom: <span className="text-white">{child.classroomId.name}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {child.address && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-white/50">
                    <span className="text-white/40">Address:</span> {child.address}
                  </p>
                </div>
              )}

              {child.status === "pending" && (
                <div className="mt-4 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-yellow-300 text-sm">
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Waiting for a teacher to add your child to their classroom.
                  </p>
                </div>
              )}
            </div>
          ))}

          {children.length === 0 && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Children Registered</h3>
              <p className="text-white/60 mb-6">Start by registering your first child</p>
              <Link
                href="/parent/add-child"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Register Your First Child
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
