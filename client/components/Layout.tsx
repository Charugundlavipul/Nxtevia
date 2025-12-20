import { PropsWithChildren, useEffect } from "react";
import { Header } from "./site/Header";
import { Footer } from "./site/Footer";
import { EvieAssistant } from "./site/EvieAssistant";
import { useLocation } from "react-router-dom";

export default function Layout({ children }: PropsWithChildren) {
  const location = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const apply = (isDark: boolean) => {
      document.documentElement.classList.toggle("dark", isDark);
    };
    const stored = localStorage.getItem("nv_theme");
    if (stored === "light" || stored === "dark") {
      apply(stored === "dark");
      return;
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    apply(mq.matches);
    const handler = (e: MediaQueryListEvent) => apply(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler as any);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler as any);
    };
  }, []);

  // Scroll to element when URL hash changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (location.hash) {
      const id = location.hash.replace("#", "");
      // Delay to allow page content render
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          // Make focusable for accessibility then focus
          if (!(el as HTMLElement).hasAttribute('tabindex')) (el as HTMLElement).setAttribute('tabindex', '-1');
          (el as HTMLElement).focus({ preventScroll: true });
        }
      });
    }
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 bg-primary text-primary-foreground px-3 py-2 rounded-md"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <EvieAssistant />
    </div>
  );
}
