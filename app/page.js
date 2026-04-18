"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [composerContent, setComposerContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const [postSuccess, setPostSuccess] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth");
        const data = await res.json();
        if (!data.success) {
          router.push("/login");
          return;
        }
        setUser(data.data.user);
        setLoading(false);
      } catch (e) {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setFeedLoading(true);
        setFeedError("");
        const res = await fetch("/api/feed", { cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          setPosts(data.data.posts);
        } else {
          setFeedError(data.error || "Failed to load feed");
        }
      } catch (e) {
        setFeedError("Failed to load feed");
      } finally {
        setFeedLoading(false);
      }
    };

    if (!loading) {
      fetchFeed();
    }
  }, [loading]);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!composerContent.trim()) return;

    setPosting(true);
    setPostError("");
    setPostSuccess("");

    try {
      const res = await fetch("/api/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: composerContent }),
      });
      const data = await res.json();
      if (data.success) {
        setComposerContent("");
        setPostSuccess("Post published!");
        setPosts((prev) => [data.data.post, ...prev]);
        setTimeout(() => setPostSuccess(""), 3000);
      } else {
        setPostError(data.error || "Failed to post");
      }
    } catch (e) {
      setPostError("Something went wrong");
    } finally {
      setPosting(false);
    }
  };

  const handlePin = async (id, current) => {
    try {
      const res = await fetch(`/api/feed/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !current }),
      });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) => prev.map((p) => p._id === id ? data.data.post : p));
      }
    } catch (e) {
      // ignore
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

      <div className="relative max-w-2xl mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Home</h1>
          <p className="text-white/60 mt-1">Latest posts from your school.</p>
        </div>

        {user?.role === "admin" && (
          <div className="mb-6 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-4">
            <form onSubmit={handlePost}>
              <textarea
                value={composerContent}
                onChange={(e) => setComposerContent(e.target.value)}
                placeholder="What&apos;s on your mind?"
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 outline-none focus:border-blue-500 transition-all resize-none"
              />
              {postError && <p className="text-red-400 text-sm mt-2">{postError}</p>}
              {postSuccess && <p className="text-green-400 text-sm mt-2">{postSuccess}</p>}
              <div className="flex justify-end mt-3">
                <button
                  type="submit"
                  disabled={posting || !composerContent.trim()}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {posting ? "Posting..." : "Post"}
                </button>
              </div>
            </form>
          </div>
        )}

        {feedLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-white/10"></div>
                  <div>
                    <div className="h-4 bg-white/10 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-white/10 rounded w-16"></div>
                  </div>
                </div>
                <div className="h-4 bg-white/10 rounded w-full mb-2"></div>
                <div className="h-4 bg-white/10 rounded w-5/6"></div>
              </div>
            ))}
          </div>
        ) : feedError ? (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <p className="text-red-300">{feedError}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post._id} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {post.authorId?.profilePicture ? (
                      <img src={post.authorId.profilePicture} alt={post.authorId.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                        {post.authorId?.name?.charAt(0).toUpperCase() || "A"}
                      </div>
                    )}
                    <div>
                      <p className="text-white font-semibold text-sm">{post.authorId?.name || "Admin"}</p>
                      <p className="text-white/40 text-xs">{new Date(post.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  {post.isPinned && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/30 text-yellow-300">Pinned</span>
                  )}
                </div>

                <p className="text-white/90 text-base mb-4 whitespace-pre-wrap">{post.content}</p>

                {user?.role === "admin" && (
                  <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                    <button
                      onClick={() => handlePin(post._id, post.isPinned)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        post.isPinned
                          ? "bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30"
                          : "text-white/50 hover:bg-white/5 hover:text-white/70"
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill={post.isPinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      {post.isPinned ? "Unpin" : "Pin"}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {posts.length === 0 && (
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                <p className="text-white/60">No posts yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
