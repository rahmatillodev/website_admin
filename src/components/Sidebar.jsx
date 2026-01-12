import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  MdDashboard,
  MdDescription,
  MdLogout,
  MdPeople,
  MdSettings,
} from "react-icons/md";
import { cn } from "@/lib/utils"; 
import useAuthStore from "@/stores/authStore";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "./modals/ConfirmModal";
import { toast } from "react-toastify";
const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: MdDashboard },
  { name: "Content Manager", href: "/content", icon: MdDescription },
  { name: "User Management", href: "/users", icon: MdPeople },
];

const systemNav = [{ name: "Settings", href: "/settings", icon: MdSettings }];

export default function Sidebar() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const { signOut } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLogOutModalOpen, setIsLogOutModalOpen] = useState(false);
  const handleConfirmLogOut = async () => {
    try {
      setLoading(true);
      signOut();
      navigate("/login");
      setLoading(false);
      setIsLogOutModalOpen(false);
      toast.success("Log out successfully");
    } catch (error) {
      console.error(error);
      setLoading(false);
      setIsLogOutModalOpen(false);
      toast.error("Log out failed");
    }
  };
  const handleLogOut = () => {
    setIsLogOutModalOpen(true);
  };

  const userEmail = user?.email || "admin@gmail.com";
  const userName =
    user?.name || user?.full_name || user?.email?.split("@")[0] || "Admin User";
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);
  const userAvatar =
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      displayName
    )}&background=0d9488&color=fff`;

  return (
    <div className="flex h-screen w-[260px] flex-col border-r border-slate-100 bg-white">
      <div className="flex h-20 items-center gap-3 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        </div>
        <div>
          <div className="text-lg font-bold text-slate-800 leading-tight">
            IELTS Sim
          </div>
          <div className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
            Admin Panel
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-4 py-4">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-[#e0f2fe] text-[#3b82f6]"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isActive ? "text-blue-500" : "text-slate-400"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* System Section */}
        <div className="mt-8">
          <div className="px-4 pb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            System
          </div>
          <div className="space-y-1">
            {systemNav.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                    isActive
                      ? "bg-[#e0f2fe] text-[#3b82f6]"
                      : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      isActive ? "text-blue-500" : "text-slate-400"
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* User Profile - Bottom */}
      <div className="mt-auto border-t border-slate-100 p-4">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="relative h-10 w-10">
            <img
              src={userAvatar}
              alt="avatar"
              className="rounded-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-bold text-slate-800 truncate">
              {displayName}
            </div>
            <div className="text-[12px] text-slate-400 truncate">
              {userEmail}
            </div>
          </div>
        </div>
        <div className="mt-2">
          <button
            onClick={handleLogOut}
            disabled={loading}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-500 transition-all duration-200 hover:bg-slate-50 hover:text-slate-700"
          >
            <MdLogout className="h-5 w-5 text-slate-400" />
            <span>Log out</span>
          </button>
        </div>
      </div>
      <ConfirmModal
        isOpen={isLogOutModalOpen}
        onClose={() => setIsLogOutModalOpen(false)}
        onConfirm={handleConfirmLogOut}
        title="Log out"
        message="Haqiqatan ham chiqib ketmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi."
        isLoading={loading}
        status="error"
      />
    </div>
  );
}
