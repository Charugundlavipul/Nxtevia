import "./global.css";

import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
  useLocation,
} from "react-router-dom";
import Banned from "./pages/Banned";
import Index from "./pages/Index";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import ApplyThankYou from "./pages/ApplyThankYou";
import PostOpportunity from "./pages/PostOpportunity";
import CompanyIndex from "./pages/CompanyIndex";
import CompanyDashboard from "./pages/CompanyDashboard";
import CompanyEmployees from "./pages/CompanyEmployees";
import CompanyEmployeeTenure from "./pages/CompanyEmployeeTenure";
import CompanyFAQ from "./pages/CompanyFAQ";
import CompanyJobReview from "./pages/CompanyJobReview";
import CompanyJobApplicants from "./pages/CompanyJobApplicants";
import CompanyEditJob from "./pages/CompanyEditJob";
import AdminJobApplicants from "./pages/AdminJobApplicants";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminJobs from "./pages/AdminJobs";
import AdminJobReview from "./pages/AdminJobReview";
import AdminEditJob from "./pages/AdminEditJob";
import AdminSeekers from "./pages/AdminSeekers";
import AdminCompanies from "./pages/AdminCompanies";
import AdminCompanyDetail from "./pages/AdminCompanyDetail";
import AdminCompanyPosting from "./pages/AdminCompanyPosting";
import AdminCompanyJobReview from "./pages/AdminCompanyJobReview";
import AdminEmployees from "./pages/AdminEmployees";
import AdminEmployeeTenure from "./pages/AdminEmployeeTenure";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminProfile from "./pages/AdminProfile";
import AdminSeekerDetail from "./pages/AdminSeekerDetail";
import AdminIndex from "./pages/AdminIndex";
import AdminChatList from "./pages/AdminChatList";
import AdminChatWindow from "./pages/AdminChatWindow";
import AdminTickets from "./pages/AdminTickets";
import CompanyChatPage from "./pages/CompanyChatPage";
import CompanyChatWindow from "./pages/CompanyChatWindow";
import CompanyChatPlaceholder from "./pages/CompanyChatPlaceholder";
import SeekerChatList from "./pages/SeekerChatList";
import SeekerChatWindow from "./pages/SeekerChatWindow";
import AdminGate from "@/components/AdminGate";
import PostOpportunitySuccess from "./pages/PostOpportunitySuccess";
import CompanyRequirements from "./pages/CompanyRequirements";
import ApplyForm from "./pages/ApplyForm";
import CompanyApplicationDetail from "./pages/CompanyApplicationDetail";
import AdminApplicationDetail from "./pages/AdminApplicationDetail";
import {
  Students,
  Companies,
  Educators,
  US,
  IN,
  CA,
  Blog,
  BlogPost,

  Privacy,
  Terms,
} from "./pages/StaticPages";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import AuthGate from "@/components/AuthGate";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import ProfileCreate from "./pages/ProfileCreate";
import CompanyProfileCreate from "./pages/CompanyProfileCreate";
import CompanyProfileUpdate from "./pages/CompanyProfileUpdate";
import Dashboard from "./pages/Dashboard";
import CreateAccount from "./pages/CreateAccount";
import SeekerHome from "./pages/SeekerHome";
import CompanyHome from "./pages/CompanyHome";
import SeekerDashboard from "./pages/SeekerDashboard";
import SeekerBadges from "./pages/SeekerBadges";
import SignupComplete from "./pages/SignupComplete";
import SignupVerify from "./pages/SignupVerify";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SeekerApplicationDetail from "./pages/SeekerApplicationDetail";
import { RoleGate } from "@/components/RoleGate";
import { useAdminSession } from "@/hooks/useAdminSession";
import { ensureSupabaseSession } from "@/lib/auth";
import { PresenceProvider } from "@/lib/presence";
import ScrollToTop from "./components/ScrollToTop";
import { supabase } from "@/lib/supabase";

const queryClient = new QueryClient();

function SignInRequired({ to }: { to: string }) {
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">Sign in to continue</h1>
        <p className="text-sm text-muted-foreground">Please sign in to access this page.</p>
        <a href={to} className="inline-flex items-center justify-center h-10 px-4 rounded-md bg-primary text-white">Go to Sign in</a>
      </div>
    </div>
  );
}

function GlobalAuthGuard({ children }: { children: React.ReactNode }) {
  const { pathname, search } = useLocation();
  const isAdmin = pathname.startsWith("/admin");
  const userAuthed = typeof window !== "undefined" && localStorage.getItem("eaas_authed") === "true";
  const { admin: adminAuthed, checking: adminChecking } = useAdminSession();
  const [checkingBan, setCheckingBan] = React.useState(true);

  React.useEffect(() => {
    ensureSupabaseSession();

    // Ban check
    const checkBan = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setCheckingBan(false);
        return;
      }

      const role = localStorage.getItem("eaas_role") || "student";
      if (role === 'admin') {
        setCheckingBan(false);
        return;
      }

      const table = role === "company" ? "company_profiles" : "seeker_profiles";
      const { data } = await supabase
        .from(table)
        .select("status")
        .eq("user_id", session.user.id)
        .maybeSingle();

      const isBanned = data?.status === "banned";

      if (isBanned && pathname !== "/banned") {
        window.location.href = "/banned";
      } else if (!isBanned && pathname === "/banned") {
        window.location.href = "/home";
      }
      setCheckingBan(false);
    };

    checkBan();
    const interval = setInterval(checkBan, 30000); // Check every 30s
    // Also listen for focus
    window.addEventListener("focus", checkBan);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", checkBan);
    };
  }, [pathname]); // Re-run on route change

  // Block rendering until initial ban check is done (for authenticated users)
  // Only block if we are actually logged in, otherwise we might block public pages unnecessarily
  if (userAuthed && checkingBan && pathname !== "/banned" && !isAdmin) {
    return <div className="min-h-screen grid place-items-center bg-white dark:bg-slate-950">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (pathname === "/banned") {
    // Determine if we should render Banned page or not (AuthGuard logic)
    // Actually GlobalAuthGuard wraps everything. If we are banned we want to show children (which will match /banned route)
    // If we are NOT banned, we already redirected above.
    return <>{children}</>;
  }

  if (isAdmin) {
    if (adminChecking) return null;
    if (!adminAuthed && !pathname.startsWith("/admin/login")) {
      const next = encodeURIComponent(pathname + search);
      return <Navigate to={`/admin/login?next=${next}`} replace />;
    }
    return <>{children}</>;
  }

  const allowed = ["/", "/home", "/login", "/signup", "/signup/verify", "/admin/login", "/forgot-password", "/reset-password", "/about", "/contact"];
  if (!userAuthed && !allowed.includes(pathname)) {
    const next = encodeURIComponent(pathname + search);
    return <SignInRequired to={`/login?next=${next}`} />;
  }
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PresenceProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <GlobalAuthGuard>
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/banned" element={<Banned />} />
              <Route
                path="/seekers/opportunities"
                element={
                  <RoleGate allowed={["student"]}>
                    <Projects />
                  </RoleGate>
                }
              />
              <Route path="/home" element={<Index />} />
              <Route path="/seekers/home" element={<RoleGate allowed={["student"]}><SeekerHome /></RoleGate>} />
              <Route path="/seekers/dashboard" element={<RoleGate allowed={["student"]}><SeekerDashboard /></RoleGate>} />
              <Route path="/seekers/applications/:id" element={<RoleGate allowed={["student"]}><SeekerApplicationDetail /></RoleGate>} />
              <Route path="/seekers/badges" element={<RoleGate allowed={["student"]}><SeekerBadges /></RoleGate>} />
              <Route path="/seekers/profile/create" element={<RoleGate allowed={["student"]}><ProfileCreate /></RoleGate>} />
              <Route path="/company/profile/create" element={
                <AuthGate>
                  <RoleGate allowed={["company"]}>
                    <CompanyProfileCreate />
                  </RoleGate>
                </AuthGate>
              } />
              <Route path="/company/profile/update" element={
                <AuthGate>
                  <RoleGate allowed={["company"]}>
                    <CompanyProfileUpdate />
                  </RoleGate>
                </AuthGate>
              } />
              <Route path="/company/home" element={<RoleGate allowed={["company"]}><CompanyHome /></RoleGate>} />
              <Route path="/opportunities/:id" element={<ProjectDetail />} />
              <Route path="/seekers/opportunities/:id" element={<RoleGate allowed={["student"]}><ProjectDetail /></RoleGate>} />
              {/* Legacy redirects */}
              <Route
                path="/projects"
                element={<Navigate to="/opportunities" replace />}
              />
              <Route path="/projects/:id" element={<LegacyProjectRedirect />} />
              <Route
                path="/post-opportunity"
                element={
                  <AuthGate>
                    <RoleGate allowed={["company"]}>
                      <PostOpportunity />
                    </RoleGate>
                  </AuthGate>
                }
              />
              <Route
                path="/company/post-opportunity"
                element={
                  <AuthGate>
                    <RoleGate allowed={["company"]}>
                      <PostOpportunity />
                    </RoleGate>
                  </AuthGate>
                }
              />
              <Route
                path="/post-opportunity/success"
                element={
                  <AuthGate>
                    <RoleGate allowed={["company"]}>
                      <PostOpportunitySuccess />
                    </RoleGate>
                  </AuthGate>
                }
              />
              <Route
                path="/company/post-opportunity/success"
                element={
                  <AuthGate>
                    <RoleGate allowed={["company"]}>
                      <PostOpportunitySuccess />
                    </RoleGate>
                  </AuthGate>
                }
              />
              <Route
                path="/apply/thank-you"
                element={
                  <RoleGate allowed={["student"]}>
                    <ApplyThankYou />
                  </RoleGate>
                }
              />
              <Route
                path="/apply/form/:id"
                element={
                  <RoleGate allowed={["student"]}>
                    <ApplyForm />
                  </RoleGate>
                }
              />
              <Route
                path="/seekers/browse_opportunities"
                element={
                  <RoleGate allowed={["student"]}>
                    <Students />
                  </RoleGate>
                }
              />
              <Route
                path="/company/post_opportunities"
                element={
                  <RoleGate allowed={["company"]}>
                    <Companies />
                  </RoleGate>
                }
              />
              <Route
                path="/company/requirements"
                element={
                  <RoleGate allowed={["company"]}>
                    <CompanyRequirements />
                  </RoleGate>
                }
              />
              <Route path="/educators" element={<Educators />} />
              <Route path="/us" element={<US />} />
              <Route path="/in" element={<IN />} />
              <Route path="/ca" element={<CA />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:post" element={<BlogPost />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />

              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/admin" element={<AdminIndex />} />
              <Route path="/company" element={<CompanyIndex />} />
              <Route
                path="/company/dashboard"
                element={
                  <AuthGate>
                    <RoleGate allowed={["company"]}>
                      <CompanyDashboard />
                    </RoleGate>
                  </AuthGate>
                }
              />
              <Route
                path="/company/employees"
                element={
                  <AuthGate>
                    <RoleGate allowed={["company"]}>
                      <CompanyEmployees />
                    </RoleGate>
                  </AuthGate>
                }
              />
              <Route
                path="/company/employees/:id/tenure"
                element={
                  <AuthGate>
                    <RoleGate allowed={["company"]}>
                      <CompanyEmployeeTenure />
                    </RoleGate>
                  </AuthGate>
                }
              />
              <Route
                path="/company/faq"
                element={
                  <AuthGate>
                    <RoleGate allowed={["company"]}>
                      <CompanyFAQ />
                    </RoleGate>
                  </AuthGate>
                }
              />
              <Route
                path="/company/jobs/:id"
                element={
                  <AuthGate>
                    <RoleGate allowed={["company"]}>
                      <CompanyJobReview />
                    </RoleGate>
                  </AuthGate>
                }
              />
              <Route
                path="/company/jobs/:id/applicants"
                element={
                  <AuthGate>
                    <RoleGate allowed={["company"]}>
                      <CompanyJobApplicants />
                    </RoleGate>
                  </AuthGate>
                }
              />
              <Route
                path="/company/applications/:id"
                element={
                  <AuthGate>
                    <RoleGate allowed={["company"]}>
                      <CompanyApplicationDetail />
                    </RoleGate>
                  </AuthGate>
                }
              />
              <Route
                path="/company/jobs/:id/edit"
                element={
                  <AuthGate>
                    <RoleGate allowed={["company"]}>
                      <CompanyEditJob />
                    </RoleGate>
                  </AuthGate>
                }
              />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin/dashboard"
                element={
                  <AdminGate>
                    <AdminDashboard />
                  </AdminGate>
                }
              />
              <Route
                path="/admin/jobs"
                element={
                  <AdminGate>
                    <AdminJobs />
                  </AdminGate>
                }
              />
              <Route
                path="/admin/jobs/:id"
                element={
                  <AdminGate>
                    <AdminJobReview />
                  </AdminGate>
                }
              />
              <Route
                path="/admin/jobs/:id/applicants"
                element={
                  <AdminGate>
                    <AdminJobApplicants />
                  </AdminGate>
                }
              />
              <Route
                path="/admin/applications/:id"
                element={
                  <AdminGate>
                    <AdminApplicationDetail />
                  </AdminGate>
                }
              />
              <Route
                path="/admin/jobs/:id/edit"
                element={
                  <AdminGate>
                    <AdminEditJob />
                  </AdminGate>
                }
              />
              <Route
                path="/admin/seekers"
                element={
                  <AdminGate>
                    <AdminSeekers />
                  </AdminGate>
                }
              />
              <Route
                path="/admin/allseekers"
                element={
                  <AdminGate>
                    <AdminSeekers />
                  </AdminGate>
                }
              />
              <Route
                path="/admin/view_seeker/:seeker_id"
                element={
                  <AdminGate>
                    <AdminSeekerDetail />
                  </AdminGate>
                }
              />
              <Route
                path="/admin/view_seekers/:seeker_id"
                element={
                  <AdminGate>
                    <AdminSeekerDetail />
                  </AdminGate>
                }
              />
              <Route
                path="/admin/companies"
                element={
                  <AdminGate>
                    <AdminCompanies />
                  </AdminGate>
                }
              />
              <Route
                path="/admin/employees"
                element={
                  <AdminGate>
                    <AdminEmployees />
                  </AdminGate>
                }
              />

              <Route
                path="/admin/employees/:id"
                element={
                  <AdminGate>
                    <AdminEmployeeTenure />
                  </AdminGate>
                }
              />
              <Route
                path="/admin/companies/:id"
                element={
                  <AdminGate>
                    <AdminCompanyDetail />
                  </AdminGate>
                }
              />
              <Route
                path="/admin/companies/:companyId/postings/:postId"
                element={
                  <AdminGate>
                    <AdminCompanyPosting />
                  </AdminGate>
                }
              />
              <Route
                path="/admin/company"
                element={
                  <AdminGate>
                    <AdminCompanyJobReview />
                  </AdminGate>
                }
              />
              <Route
                path="/admin/analytics"
                element={
                  <AdminGate>
                    <AdminAnalytics />
                  </AdminGate>
                }
              />
              <Route
                path="/admin/profile"
                element={
                  <AdminGate>
                    <AdminProfile />
                  </AdminGate>
                }
              />
              <Route
                path="/admin/chats"
                element={
                  <AdminGate>
                    <AdminChatList />
                  </AdminGate>
                }
              />
              <Route
                path="/admin/chats/:conversationId"
                element={
                  <AdminGate>
                    <AdminChatWindow />
                  </AdminGate>
                }
              />
              <Route
                path="/admin/tickets"
                element={
                  <AdminGate>
                    <AdminTickets />
                  </AdminGate>
                }
              />
              <Route
                path="/company/chats"
                element={
                  <AuthGate>
                    <RoleGate allowed={["company"]}>
                      <CompanyChatPage />
                    </RoleGate>
                  </AuthGate>
                }
              >
                <Route index element={<CompanyChatPlaceholder />} />
                <Route path=":conversationId" element={<CompanyChatWindow />} />
              </Route>
              <Route
                path="/seeker/chats"
                element={
                  <AuthGate>
                    <RoleGate allowed={["student"]}>
                      <SeekerChatList />
                    </RoleGate>
                  </AuthGate>
                }
              />
              <Route
                path="/seeker/chats/:conversationId"
                element={
                  <AuthGate>
                    <RoleGate allowed={["student"]}>
                      <SeekerChatWindow />
                    </RoleGate>
                  </AuthGate>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<CreateAccount />} />
              <Route path="/signup/complete" element={<SignupComplete />} />
              <Route path="/signup/verify" element={<SignupVerify />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/profile/edit" element={<RoleGate allowed={["student"]}><ProfileEdit /></RoleGate>} />
              <Route path="/profile/create" element={<RoleGate allowed={["student"]}><ProfileCreate /></RoleGate>} />
              <Route path="/company/profile/:username" element={<Profile />} />
              <Route path="/dashboard" element={<RoleGate allowed={["student"]}><Dashboard /></RoleGate>} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </GlobalAuthGuard>
        </BrowserRouter>
      </PresenceProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

function LegacyProjectRedirect() {
  const { id } = useParams();
  return <Navigate to={`/opportunities/${id ?? ""}`} replace />;
}

const container = document.getElementById("root")!;
// Reuse existing root during HMR to avoid createRoot warning
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const existingRoot = (window as any).__app_root;
const root = existingRoot ?? createRoot(container);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).__app_root = root;
root.render(<App />);
