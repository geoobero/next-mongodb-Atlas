"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminFeedPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ content: "" });
  const router = useRouter();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/feed");
      const data = await res.json();
      if (data.success) {
        setPosts(data.data.posts);
      } else {
        setError(data.error || "Failed to fetch posts");
      }
    } catch (e) {
      setError("Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth");
        const data = await res.json();
        if (!data.success || data.data.user.role !== "admin") {
          router.push("/login");
          return;
        }
        fetchPosts();
      } catch (e) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      let res;
      if (modalMode === "create") {
        res = await fetch("/api/feed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      } else {
        res = await fetch(`/api/feed/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to save post");
        return;
      }

      setSuccess(modalMode === "create" ? "Post created!" : "Post updated!");
      setShowModal(false);
      setForm({ content: "" });
      setEditingId(null);
      fetchPosts();
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  };

  const handleEdit = (post) => {
    setEditingId(post._id);
    setModalMode("edit");
    setForm({ content: post.content });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      const res = await fetch(`/api/feed/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setSuccess("Post deleted.");
        fetchPosts();
      } else {
        setError(data.error || "Failed to delete");
      }
    } catch (e) {
      setError("Failed to delete post");
    }
  };

  const handleTogglePin = async (id, current) => {
    try {
      const res = await fetch(`/api/feed/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !current }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(!current ? "Post pinned." : "Post unpinned.");
        fetchPosts();
      } else {
        setError(data.error || "Failed to update");
      }
    } catch (e) {
      setError("Failed to update post");
    }
  };

  const openCreate = () => {
    setModalMode("create");
    setEditingId(null);
    setForm({ content: "" });
    setShowModal(true);
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
            <h1 className="text-3xl font-bold text-white">Manage Feed</h1>
            <p className="text-white/60 mt-1">Edit, pin, or delete posts</p>
          </div>
          <button onClick={openCreate} className="mt-4 md:mt-0 inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Post
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">{error}</div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-300 text-sm">{success}</div>
        )}

        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post._id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {post.isPinned && <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/30 text-yellow-300">Pinned</span>}
                  </div>
                  <p className="text-white/80 text-sm mb-3 whitespace-pre-wrap">{post.content}</p>
                  <div className="flex items-center gap-4 text-xs text-white/50">
                    <span>By: {post.authorId?.name || "Unknown"}</span>
                    <span>{new Date(post.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <button onClick={() => handleEdit(post)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Edit">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button onClick={() => handleTogglePin(post._id, post.isPinned)} className="p-2 text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors" title={post.isPinned ? "Unpin" : "Pin"}>
                    <svg className="w-4 h-4" fill={post.isPinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                  <button onClick={() => handleDelete(post._id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {posts.length === 0 && (
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
              <p className="text-white/60">No posts yet. Click &quot;Add New Post&quot; to create one.</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              {modalMode === "create" ? "Create New Post" : "Edit Post"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Content</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 outline-none focus:border-blue-500 transition-all resize-none"
                  placeholder="What&apos;s on your mind?"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all">
                  {modalMode === "create" ? "Create Post" : "Update Post"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 border border-white/10 text-white rounded-xl hover:bg-white/5 transition-all">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
