import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="container max-w-md text-center space-y-8">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-50 animate-pulse"></div>
          <h1 className="relative text-9xl font-black text-slate-200 dark:text-slate-800">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg">
              Page Not Found
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="shadow-lg shadow-primary/20">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" /> Return Home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="bg-white dark:bg-slate-900">
              <Link to={-1 as any}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
