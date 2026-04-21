"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Navbar() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationPage, setNotificationPage] = useState(0);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(false);
  const [fetchingNotifications, setFetchingNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const pathname = usePathname();
  const router = useRouter();

  const fetchUser = async () => {
    if (!hasInitializedRef.current) {
      setLoading(true);
    }

    try {
      const res = await fetch("/api/auth", { cache: "no-store" });
      const data = await res.json();

      if (data.success) {
        setUser(data.data.user);
        fetchNotifications();
      } else {
        setUser(null);
        setNotificationCount(0);
      }
    } catch (e) {
      setUser(null);
      setNotificationCount(0);
    } finally {
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  const fetchNotifications = async (append = false) => {
    try {
      if (!append) {
        setFetchingNotifications(true);
      }
      const skip = append ? (notificationPage + 1) * 5 : 0;
      const res = await fetch(`/api/notifications?limit=5&skip=${skip}`);
      const data = await res.json();
      if (data.success) {
        if (append) {
          setNotifications((prev) => [...prev, ...data.data.notifications]);
          setNotificationPage((prev) => prev + 1);
        } else {
          setNotifications(data.data.notifications);
          setNotificationPage(0);
        }
        setHasMoreNotifications(data.data.hasMore);
        setNotificationCount(data.data.unreadCount);
      }
    } catch (e) {
      console.error("Error fetching notifications:", e);
    } finally {
      setFetchingNotifications(false);
    }
  };

  const handleShowMoreNotifications = () => {
    fetchNotifications(true);
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await fetch("/api/notifications/read-all", { method: "PUT" });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true }))
        );
        setNotificationCount(0);
      }
    } catch (e) {
      console.error("Error marking all as read:", e);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, read: true } : n))
        );
        setNotificationCount((prev) => Math.max(0, prev - 1));
      }
    } catch (e) {
      console.error("Error marking as read:", e);
    }
  };

  const handleDeleteNotification = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        const wasUnread = notifications.find((n) => n._id === id && !n.read);
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        if (wasUnread) {
          setNotificationCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (e) {
      console.error("Error deleting notification:", e);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "enrollment":
        return "📬";
      case "absence_reminder":
        return "📢";
      case "report_update":
        return "💬";
      default:
        return "⚙️";
    }
  };

  const getRelativeTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString();
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(() => fetchNotifications(), 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
        setNotificationDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setDropdownOpen(false);
    setNotificationDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      // Ignore
    }

    setUser(null);
    setNotificationCount(0);
    setNotifications([]);
    router.push("/login");
    router.refresh();
  };

  const isActive = (href) => pathname === href;

  const getGeneralLinks = () => {
    if (user?.role === "admin") {
      return [
        { name: "HOME", href: "/" },
        { name: "REPORTS", href: "/admin/reports" },
      ];
    }

    if (user?.role === "parent") {
      return [
        { name: "HOME", href: "/" },
        { name: "HELP CENTER", href: "/help-center" },
      ];
    }

    if (user?.role === "teacher") {
      return [{ name: "HOME", href: "/" }];
    }

    return [{ name: "HOME", href: "/" }];
  };

  const getRoleBadgeClass = () => {
    switch (user?.role) {
      case "admin":
        return "bg-purple-500/30 text-purple-300 border-purple-500/30";
      case "teacher":
        return "bg-green-500/30 text-green-300 border-green-500/30";
      case "parent":
        return "bg-blue-500/30 text-blue-300 border-blue-500/30";
      default:
        return "bg-white/20 text-white border-white/20";
    }
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case "admin":
        return "Admin";
      case "teacher":
        return "Teacher";
      case "parent":
        return "Parent";
      default:
        return "User";
    }
  };

  const handleBellClick = () => {
    if (!notificationDropdownOpen) {
      setNotificationPage(0);
      fetchNotifications();
    }
    setNotificationDropdownOpen(!notificationDropdownOpen);
  };

  if (loading) {
    return (
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent"
            >
              EduHub
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  if (!user) {
    return (
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/"
              className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent"
            >
              EduHub
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/5 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            {/* Desktop Logo - hidden on mobile for admin, always visible for others */}
            {user.role !== "admin" ? (
              <Link
                href="/"
                className="text-2xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent"
              >
                EduHub
              </Link>
            ) : (
              <div className="flex items-center">
                {/* Burger icon - mobile only for admin */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-all mr-2"
                >
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                {/* Logo - desktop only for admin */}
                <Link
                  href="/"
                  className="hidden md:block md:text-2xl md:font-bold md:bg-gradient-to-r md:from-red-400 md:to-orange-400 md:bg-clip-text md:text-transparent text-white"
                >
                  EduHub
                </Link>
              </div>
            )}

            {/* Desktop Nav Links - hidden on mobile */}
            <div className="hidden md:flex space-x-1">
              {getGeneralLinks().map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(link.href)
                      ? "bg-white/10 text-white border border-white/20"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {user.role === "admin" && (
                <>
                  <Link
                    href="/admin/users"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive("/admin/users")
                        ? "bg-white/10 text-white border border-white/20"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    USERS
                  </Link>
                  <Link
                    href="/admin/classrooms"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive("/admin/classrooms")
                        ? "bg-white/10 text-white border border-white/20"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    CLASSROOMS
                  </Link>
                  <Link
                    href="/admin/school-years"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive("/admin/school-years")
                        ? "bg-white/10 text-white border border-white/20"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    SCHOOL YEARS
                  </Link>
                  <Link
                    href="/admin/feed"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive("/admin/feed")
                        ? "bg-white/10 text-white border border-white/20"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    FEED
                  </Link>
                </>
              )}

              {user.role === "teacher" && (
                <>
                  <Link
                    href="/teacher/attendance"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive("/teacher/attendance")
                        ? "bg-white/10 text-white border border-white/20"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    ATTENDANCE
                  </Link>
                  <Link
                    href="/teacher/students"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive("/teacher/students")
                        ? "bg-white/10 text-white border border-white/20"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    MY STUDENTS
                  </Link>
                </>
              )}

              {user.role === "parent" && (
                <>
                  <Link
                    href="/parent/children"
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive("/parent/children")
                        ? "bg-white/10 text-white border border-white/20"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    MY CHILDREN
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Notification Bell for Parent */}
            {user.role === "parent" && (
              <div className="relative" ref={notificationDropdownRef}>
                <button
                  onClick={handleBellClick}
                  className="relative p-2 rounded-lg hover:bg-white/10 transition-all"
                >
                  <svg
                    className="w-6 h-6 text-white/70"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </span>
                  )}
                </button>

                {notificationDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40 bg-black/50 md:hidden" />
                    <div className="fixed inset-x-0 top-20 z-50 flex justify-center px-4 md:absolute md:inset-auto md:right-0 md:top-full md:mt-3 md:block md:px-0">
                    <div className="relative z-10 w-full max-w-sm max-h-[calc(100vh-2rem)] overflow-hidden backdrop-blur-xl bg-black border border-white/10 rounded-2xl shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-200 md:w-80 md:max-h-none md:max-w-none md:animate-in md:slide-in-from-top-2">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
                      <span className="text-sm font-semibold text-white">
                        Notifications
                      </span>
                      <Link
                        href="/notifications"
                        onClick={() => setNotificationDropdownOpen(false)}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        View all
                      </Link>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-white/50 text-sm">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification._id}
                            onClick={() => handleMarkAsRead(notification._id)}
                            className={`flex items-start px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors ${
                              !notification.read ? "bg-white/5" : ""
                            }`}
                          >
                            <span className="text-lg mr-3">
                              {getNotificationIcon(notification.type)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm ${
                                  notification.read
                                    ? "text-white/60"
                                    : "text-white"
                                }`}
                              >
                                {notification.message}
                              </p>
                              <p className="text-xs text-white/40 mt-1">
                                {getRelativeTime(notification.createdAt)}
                              </p>
                            </div>
                            <button
                              onClick={(e) =>
                                handleDeleteNotification(notification._id, e)
                              }
                              className="text-white/30 hover:text-red-400 transition-colors ml-2"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {hasMoreNotifications && (
                      <button
                        onClick={handleShowMoreNotifications}
                        disabled={fetchingNotifications}
                        className="w-full px-4 py-2 text-sm text-blue-400 hover:text-blue-300 border-t border-white/10 disabled:opacity-50"
                      >
                        {fetchingNotifications
                          ? "Loading..."
                          : `Show more (${notificationPage * 5 + notifications.length}+)`}
                      </button>
                    )}

                    {notificationCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="w-full px-4 py-2 text-sm text-green-400 hover:text-green-300 border-t border-white/10"
                      >
                        ✓ Mark all as read
                      </button>
                    )}
                    </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 p-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
              >
                {user?.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    className="w-9 h-9 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
                <svg
                  className={`w-4 h-4 text-white/60 mr-1 transition-transform duration-200 ${
                    dropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-72 backdrop-blur-xl bg-black border border-white/10 rounded-2xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                  <div className="px-4 py-3 border-b border-white/10 flex items-center space-x-3">
                    {user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt="Profile"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-white">{user?.name}</p>
                      <p className="text-xs text-white/50">{user?.email}</p>
                      <span
                        className={`inline-block mt-1 text-xs px-2.5 py-0.5 rounded-full border ${getRoleBadgeClass()}`}
                      >
                        {getRoleLabel()}
                      </span>
                    </div>
                  </div>

                  {/* Mobile-only links for Teacher */}
                  {user.role === "teacher" && (
                    <>
                      <Link
                        href="/teacher/attendance"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors md:hidden"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        ATTENDANCE
                      </Link>
                      <Link
                        href="/teacher/students"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors md:hidden"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354v15.141a9 9 0 01-5.998 2.353A9 9 0 0112 20.354V4.354z" />
                        </svg>
                        MY STUDENTS
                      </Link>
                    </>
                  )}

                  {/* Mobile-only links for Parent */}
                  {user.role === "parent" && (
                    <>
                      <Link
                        href="/help-center"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors md:hidden"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        HELP CENTER
                      </Link>
                      <Link
                        href="/parent/children"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors md:hidden"
                      >
                        <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354v15.141a9 9 0 01-5.998 2.353A9 9 0 0112 20.354V4.354z" />
                        </svg>
                        MY CHILDREN
                      </Link>
                    </>
                  )}

                  <Link
                    href="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center px-4 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Profile
                  </Link>

                  {user.role === "admin" && (
                    <>
                      <Link
                        href="/admin/add-user"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center px-4 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <svg
                          className="w-4 h-4 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                          />
                        </svg>
                        Add User
                      </Link>

                    </>
                  )}

                  {user.role === "parent" && (
                    <Link
                      href="/parent/add-child"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center px-4 py-3 text-sm text-white/80 hover:bg-white/5 hover:text-white transition-colors"
                    >
                      <svg
                        className="w-4 h-4 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Add Child
                    </Link>
                  )}

                  <div className="border-t border-white/10 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <svg
                        className="w-4 h-4 mr-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar for Admin */}
      {mobileMenuOpen && user.role === "admin" && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            ref={mobileMenuRef}
            className="absolute top-16 left-0 w-64 h-[calc(100vh-4rem)] backdrop-blur-xl bg-slate-900 border-r border-white/10 py-4 animate-in slide-in-from-left duration-200"
          >
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-white/60 hover:text-white"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="mt-8 px-4">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive("/")
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                HOME
              </Link>

              <Link
                href="/admin/reports"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive("/admin/reports")
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                REPORTS
              </Link>

              <Link
                href="/admin/users"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive("/admin/users")
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                USERS
              </Link>

              <Link
                href="/admin/classrooms"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive("/admin/classrooms")
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                CLASSROOMS
              </Link>

              <Link
                href="/admin/school-years"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive("/admin/school-years")
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                SCHOOL YEARS
              </Link>

              <Link
                href="/admin/feed"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium ${
                  isActive("/admin/feed")
                    ? "bg-white/10 text-white"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                FEED
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
