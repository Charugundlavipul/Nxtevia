import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./ThemeToggle";
import { appSignOut } from "@/lib/auth";
import { useAdminSession } from "@/hooks/useAdminSession";
import { supabase } from "@/lib/supabase";
import { Menu, X, ChevronRight, LogOut, User, LayoutDashboard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Role = "student" | "company" | null;

export function Header() {
  const [role, setRole] = useState<Role>(null);
  const [authed, setAuthed] = useState(false);
  const { admin: adminAuthed } = useAdminSession();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const a = localStorage.getItem("eaas_authed") === "true";
    const r = (localStorage.getItem("eaas_role") as Role) || null;
    setAuthed(a);
    setRole(r);

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const baseLink = "text-sm font-medium transition-colors hover:text-primary";
  const navLink = ({ isActive }: { isActive: boolean }) =>
    cn(baseLink, isActive ? "text-primary font-semibold" : "text-muted-foreground");

  const [open, setOpen] = useState(false);
  const location = useLocation();
  const [activeSection, setActiveSection] = useState<"home" | "opportunities" | "how-it-works" | "faq" | null>("home");

  useEffect(() => {
    if (location.pathname !== "/home") {
      setActiveSection(null);
      return;
    }
    const ids = ["home", "opportunities", "how-it-works", "faq"];
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id as any);
          }
        });
      },
      { threshold: 0.6 }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [location.pathname]);

  const isAdmin = location.pathname.startsWith("/admin");
  const showAuthed = isAdmin ? adminAuthed : authed;
  const companyName = (localStorage.getItem("eaas_company_name") || "company").toString();
  const companySlug = companyName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "company";
  const profilePath = isAdmin ? "/admin/profile" : (authed && role === "company" ? `/company/profile/${companySlug}` : "/profile/me");

  const handleSignOut = async () => {
    if (isAdmin) {
      await supabase.auth.signOut();
      navigate("/admin/login");
    } else {
      await appSignOut();
      navigate("/login");
    }
  };

  const userInitials = isAdmin ? "A" : ((role ?? "").slice(0, 1).toUpperCase() || "U");

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-200",
        scrolled
          ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-slate-200 dark:border-slate-800 shadow-sm"
          : "bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm border-transparent"
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to={authed ? (role === "company" ? "/company/home" : "/seekers/home") : "/home"} className="flex items-center gap-2 transition-opacity hover:opacity-90">
            {/* Light mode logo */}
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F92b357447c84469e810f664e6a70c853%2F38cb528327ce42aaad0ef44c24b7d60a?format=webp&width=240"
              alt="NxteVia"
              className="h-8 w-auto block dark:hidden"
              fetchPriority="high"
              decoding="async"
            />
            {/* Dark mode logo */}
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F92b357447c84469e810f664e6a70c853%2F5593aaa912284d02ba58fbc881de80a0?format=webp&width=240"
              alt="NxteVia"
              className="h-8 w-auto hidden dark:block"
              decoding="async"
            />
            <span className="sr-only">NxteVia</span>
          </Link>

          {!isAdmin ? (
            <nav className="hidden md:flex items-center gap-6">
              {authed && role === "company" ? (
                <>
                  <NavLink to="/company/home" className={navLink}>Home</NavLink>
                  <NavLink to="/company/dashboard" className={navLink}>Dashboard</NavLink>
                  <NavLink to="/company/employees" className={navLink}>Employees</NavLink>
                  <NavLink to="/company/chats" className={navLink}>Messages</NavLink>
                  <NavLink to="/company/requirements" className={navLink}>Requirements</NavLink>
                </>
              ) : authed && role === "student" ? (
                <>
                  <NavLink to="/seekers/home" className={navLink}>Home</NavLink>
                  <NavLink to="/seekers/opportunities" className={navLink}>Opportunities</NavLink>
                  <NavLink to="/seekers/dashboard" className={navLink}>Dashboard</NavLink>
                  <NavLink to="/seeker/chats" className={navLink}>Messages</NavLink>
                  <NavLink to="/seekers/badges" className={navLink}>Certifications</NavLink>
                </>
              ) : (
                <>
                  <a href="/home#home" className={cn(baseLink, activeSection === "home" && location.pathname === "/home" ? "text-primary font-semibold" : "text-muted-foreground")}>Home</a>
                  <a href="/home#opportunities" className={cn(baseLink, activeSection === "opportunities" && location.pathname === "/home" ? "text-primary font-semibold" : "text-muted-foreground")}>Opportunities</a>
                  <a href="/home#how-it-works" className={cn(baseLink, activeSection === "how-it-works" && location.pathname === "/home" ? "text-primary font-semibold" : "text-muted-foreground")}>How it Works</a>
                  <NavLink to="/about" className={navLink}>About</NavLink>
                </>
              )}
            </nav>
          ) : (
            <nav className="hidden md:flex items-center gap-6">
              <NavLink to="/admin/dashboard" className={navLink}>Dashboard</NavLink>
              <NavLink to="/admin/jobs" className={navLink}>Jobs</NavLink>
              <NavLink to="/admin/seekers" className={navLink}>Seekers</NavLink>
              <NavLink to="/admin/companies" className={navLink}>Companies</NavLink>
              <NavLink to="/admin/employees" className={navLink}>Employees</NavLink>
              <NavLink to="/admin/chats" className={navLink}>Messages</NavLink>
              <NavLink to="/admin/analytics" className={navLink}>Analytics</NavLink>
              <NavLink to="/admin/tickets" className={navLink}>Tickets</NavLink>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {showAuthed ? (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9 border border-slate-200 dark:border-slate-700">
                      <AvatarImage src="" alt={userInitials} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{isAdmin ? "Administrator" : (role === "company" ? "Company Account" : "Seeker Account")}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {isAdmin ? "admin@nxtevia.com" : "Signed in"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={isAdmin ? "/admin/dashboard" : (role === "company" ? "/company/dashboard" : "/seekers/dashboard")} className="cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={profilePath} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" className="hidden md:inline-flex text-muted-foreground hover:text-foreground">
                <Link to={isAdmin ? "/admin/login" : "/login"}>Sign in</Link>
              </Button>
              <Button asChild className="hidden md:inline-flex shadow-sm">
                <Link to={isAdmin ? "/admin/login" : "/signup"}>{isAdmin ? "Admin login" : "Get started"}</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl animate-in slide-in-from-top-2">
          <div className="container py-4 grid gap-1">
            {!isAdmin ? (
              <>
                {authed && role === "company" ? (
                  <>
                    <MobileLink to="/company/home" onClick={() => setOpen(false)}>Home</MobileLink>
                    <MobileLink to="/company/dashboard" onClick={() => setOpen(false)}>Dashboard</MobileLink>
                    <MobileLink to="/company/employees" onClick={() => setOpen(false)}>Employees</MobileLink>
                    <MobileLink to="/company/chats" onClick={() => setOpen(false)}>Messages</MobileLink>
                    <MobileLink to="/company/requirements" onClick={() => setOpen(false)}>Requirements</MobileLink>
                  </>
                ) : authed && role === "student" ? (
                  <>
                    <MobileLink to="/seekers/home" onClick={() => setOpen(false)}>Home</MobileLink>
                    <MobileLink to="/seekers/opportunities" onClick={() => setOpen(false)}>Opportunities</MobileLink>
                    <MobileLink to="/seekers/dashboard" onClick={() => setOpen(false)}>Dashboard</MobileLink>
                    <MobileLink to="/seeker/chats" onClick={() => setOpen(false)}>Messages</MobileLink>
                    <MobileLink to="/seekers/badges" onClick={() => setOpen(false)}>Certifications</MobileLink>
                  </>
                ) : (
                  <>
                    <MobileLink href="/home#home" onClick={() => setOpen(false)}>Home</MobileLink>
                    <MobileLink href="/home#opportunities" onClick={() => setOpen(false)}>Opportunities</MobileLink>
                    <MobileLink href="/home#how-it-works" onClick={() => setOpen(false)}>How it Works</MobileLink>
                    <MobileLink to="/about" onClick={() => setOpen(false)}>About</MobileLink>
                  </>
                )}
              </>
            ) : (
              <>
                <MobileLink to="/admin/dashboard" onClick={() => setOpen(false)}>Dashboard</MobileLink>
                <MobileLink to="/admin/jobs" onClick={() => setOpen(false)}>Jobs</MobileLink>
                <MobileLink to="/admin/seekers" onClick={() => setOpen(false)}>Seekers</MobileLink>
                <MobileLink to="/admin/companies" onClick={() => setOpen(false)}>Companies</MobileLink>
                <MobileLink to="/admin/employees" onClick={() => setOpen(false)}>Employees</MobileLink>
                <MobileLink to="/admin/chats" onClick={() => setOpen(false)}>Messages</MobileLink>
                <MobileLink to="/admin/analytics" onClick={() => setOpen(false)}>Analytics</MobileLink>
                <MobileLink to="/admin/tickets" onClick={() => setOpen(false)}>Tickets</MobileLink>
              </>
            )}

            <div className="my-2 border-t border-slate-100 dark:border-slate-800" />

            {showAuthed ? (
              <>
                <MobileLink to={profilePath} onClick={() => setOpen(false)}>Profile</MobileLink>
                <button
                  onClick={() => { setOpen(false); handleSignOut(); }}
                  className="flex w-full items-center justify-between rounded-md p-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="grid gap-2 mt-2">
                <Button asChild variant="outline" className="w-full justify-center">
                  <Link to={isAdmin ? "/admin/login" : "/login"} onClick={() => setOpen(false)}>Sign in</Link>
                </Button>
                <Button asChild className="w-full justify-center">
                  <Link to={isAdmin ? "/admin/login" : "/signup"} onClick={() => setOpen(false)}>{isAdmin ? "Admin login" : "Get started"}</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function MobileLink({ to, href, children, onClick }: { to?: string; href?: string; children: React.ReactNode; onClick?: () => void }) {
  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        className="flex w-full items-center justify-between rounded-md p-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        {children}
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </a>
    );
  }
  return (
    <Link
      to={to!}
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-md p-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    >
      {children}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
