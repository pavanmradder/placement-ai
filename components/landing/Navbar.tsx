"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { Menu, X, ArrowRight, Bot, LogOut, User as UserIcon, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const userEmail = user?.email?.trim().toLowerCase() || "";
  const isAdmin = userEmail === "pavanmradder@gmail.com";

  const displayName = isAdmin
    ? "Admin (Pavan)"
    : user?.user_metadata?.name ||
      user?.user_metadata?.full_name ||
      user?.email?.split("@")[0] ||
      "Student";
  const avatarInitial = isAdmin ? "P" : displayName.charAt(0).toUpperCase();

  const navLinks = [
    { name: "Features", href: "/#features" },
    { name: "How It Works", href: "/#how-it-works" },
    { name: "About", href: "/#about" },
  ];

  const dashboardHref = isAdmin ? "/admin" : "/dashboard";
  const dashboardLabel = isAdmin ? "Admin Console" : "Dashboard";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#07090e]/90 backdrop-blur-md border-b border-white/[0.08] shadow-lg shadow-black/30 py-3.5"
          : "bg-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group transition-transform duration-200 hover:scale-[1.02]"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] flex items-center justify-center shadow-md shadow-indigo-500/25">
              <div className="w-full h-full bg-[#090d16] rounded-[11px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
              </div>
            </div>
            <div className="flex items-baseline">
              <span className="text-xl font-bold tracking-tight text-white">
                Placement<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">AI</span>
              </span>
              <span className="ml-2 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 rounded-md">
                Beta
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-slate-300 hover:text-white transition-colors duration-150 relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[2px] after:bg-gradient-to-r after:from-indigo-500 after:to-cyan-400 hover:after:w-full after:transition-all after:duration-250"
              >
                {link.name}
              </Link>
            ))}
            {user && (
              <Link
                href={dashboardHref}
                className={`${
                  isAdmin ? "text-amber-300 hover:text-amber-200" : "text-cyan-300 hover:text-white"
                } transition-colors duration-150 relative py-1 flex items-center gap-1.5 font-semibold`}
              >
                <LayoutDashboard className={`w-4 h-4 ${isAdmin ? "text-amber-400" : "text-cyan-400"}`} />
                <span>{dashboardLabel}</span>
              </Link>
            )}
          </nav>

          {/* Desktop Auth / Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  href={dashboardHref}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${
                    isAdmin
                      ? "bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20"
                      : "bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] hover:border-cyan-500/30"
                  } text-xs text-slate-200 transition-all group`}
                  title={`Go to ${dashboardLabel}`}
                >
                  <div className={`w-6 h-6 rounded-full ${
                    isAdmin
                      ? "bg-gradient-to-tr from-amber-500 to-orange-500"
                      : "bg-gradient-to-tr from-indigo-500 to-cyan-400"
                  } flex items-center justify-center text-[10px] font-bold text-white shadow-inner`}>
                    {avatarInitial}
                  </div>
                  <span className={`font-medium max-w-[130px] truncate ${
                    isAdmin ? "text-amber-300" : "group-hover:text-cyan-300"
                  } transition-colors`}>
                    {displayName}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => signOut("/")}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-rose-300 px-3 py-2 rounded-lg hover:bg-white/[0.05] transition-all cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-slate-300 hover:text-white px-4 py-2 rounded-lg hover:bg-white/[0.05] transition-all duration-150 cursor-pointer"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="group relative inline-flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] focus:outline-none cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a0f1d]/95 backdrop-blur-xl border-b border-white/10 px-6 py-6 shadow-2xl transition-all duration-200">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-base font-medium text-slate-200 hover:text-white py-2 border-b border-white/5"
              >
                {link.name}
              </Link>
            ))}
            {user && (
              <Link
                href={dashboardHref}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-base font-medium ${
                  isAdmin ? "text-amber-300 hover:text-amber-200" : "text-cyan-300 hover:text-cyan-200"
                } py-2 border-b border-white/5 flex items-center gap-2`}
              >
                <LayoutDashboard className={`w-4 h-4 ${isAdmin ? "text-amber-400" : "text-cyan-400"}`} />
                <span>{dashboardLabel}</span>
              </Link>
            )}
            <div className="flex flex-col gap-3 pt-3">
              {user ? (
                <>
                  <div className="flex items-center gap-2.5 py-2 text-sm text-slate-200">
                    <UserIcon className="w-4 h-4 text-cyan-400" />
                    <span>Signed in as <strong>{displayName}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut("/");
                    }}
                    className="w-full flex items-center justify-center gap-2 text-sm font-medium text-rose-300 hover:text-rose-200 py-2.5 border border-rose-500/20 bg-rose-500/10 rounded-xl cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 text-sm font-medium text-slate-300 hover:text-white border border-white/10 rounded-xl bg-white/[0.03]"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 shadow-lg shadow-indigo-600/25"
                  >
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
