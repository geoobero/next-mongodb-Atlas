"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth");
        const data = await res.json();
        
        if (!data.success) {
          router.push("/login");
          return;
        }
        
        setUser(data.data.user);
        setName(data.data.user.name || "");
        setProfilePicture(data.data.user.profilePicture || "");
        setPreviewImage(data.data.user.profilePicture || "");
      } catch (error) {
        console.error("Error fetching user:", error);
        router.push("/login");
      }
      
      setPageLoading(false);
    };
    
    fetchUser();
  }, [router]);

  useEffect(() => {
    if (!pageLoading) {
      setLoading(false);
    }
  }, [pageLoading]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "Image size must be less than 5MB" });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setProfilePicture(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: "", text: "" });
    
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, profilePicture }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        setUser(data.data.user);
        setIsEditing(false);
        setShowSuccessModal(true);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update profile" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Something went wrong" });
    }
    
    setSaving(false);
  };

  const handleCancel = () => {
    setName(user?.name || "");
    setPreviewImage(user?.profilePicture || "");
    setProfilePicture(user?.profilePicture || "");
    setIsEditing(false);
    setMessage({ type: "", text: "" });
  };

  if (pageLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[100vh] bg-slate-900 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl bg-blue-500/20"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl bg-purple-500/20"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">My Profile</h1>
          <p className="text-lg text-white/60">Manage your account settings</p>
        </div>

        {message.text && message.type === "error" && (
          <div className="max-w-md mx-auto mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400">
            {message.text}
          </div>
        )}

        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Success!</h3>
                <p className="text-white/60 mb-4">Profile updated successfully!</p>
              </div>
            </div>
          </div>
        )}

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-2xl">
                {previewImage ? (
                  <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-4xl font-bold">{user?.name?.charAt(0).toUpperCase() || "U"}</span>
                )}
              </div>
              
              {isEditing && (
                <label className="mt-4 cursor-pointer">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm hover:bg-white/20 transition-all flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Change Photo
                  </div>
                </label>
              )}
              
              <div className="mt-4 text-center space-y-1">
                <p className="text-white/40 text-sm">{user?.email}</p>
                <p className="text-purple-400/70 text-sm font-medium">
                  {user?.role === "admin" ? "Administrator" : "User"}
                </p>
              </div>
            </div>

            <div className="flex-1 w-full">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-4 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    placeholder="Enter your name"
                  />
                </div>

                {isEditing ? (
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 py-3.5 max-w-100 w-full cursor-pointer duration-300 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="px-6 py-3.5 duration-300 cursor-pointer bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="max-w-100 w-full cursor-pointer duration-300 py-3.5 bg-blue-400 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
