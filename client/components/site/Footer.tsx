import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";

type Role = "student" | "company" | null;

export function Footer() {
  const [role, setRole] = useState<Role>(null);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const a = localStorage.getItem("eaas_authed") === "true";
    const r = (localStorage.getItem("eaas_role") as Role) || null;
    setAuthed(a);
    setRole(r);
  }, []);

  return (
    <footer className="bg-slate-900 text-slate-200 border-t border-slate-800">
      <div className="container py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F92b357447c84469e810f664e6a70c853%2F5593aaa912284d02ba58fbc881de80a0?format=webp&width=240"
                alt="NxteVia"
                className="h-8 w-auto"
              />
            </div>
            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
              Empowering every individual to grow through real-world experience
            </p>
            <div className="flex gap-4 pt-2">
              <SocialLink href="#" icon={<Linkedin className="h-4 w-4" />} label="LinkedIn" />
              <SocialLink href="#" icon={<Twitter className="h-4 w-4" />} label="Twitter" />
              <SocialLink href="#" icon={<Instagram className="h-4 w-4" />} label="Instagram" />
              <SocialLink href="#" icon={<Facebook className="h-4 w-4" />} label="Facebook" />
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-3 text-sm">
              {(!authed || role === "student") && (
                <li><FooterLink to="/opportunities">Browse Opportunities</FooterLink></li>
              )}
              {(!authed || role === "company") && (
                <li><FooterLink to="/company/post-opportunity">Post an Opportunity</FooterLink></li>
              )}
              {(!authed || role === "student") && (
                <li><FooterLink to="/seekers/browse_opportunities">For Seekers</FooterLink></li>
              )}
              {(!authed || role === "company") && (
                <li><FooterLink to="/company/post_opportunities">For Companies</FooterLink></li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-3 text-sm">
              <li><FooterLink to="/about">About Us</FooterLink></li>
              <li><FooterLink to="/contact">Contact</FooterLink></li>
              <li><FooterLink to={authed && role === "company" ? "/company/faq" : "/#faq"}>FAQ</FooterLink></li>

            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li><FooterLink to="/privacy">Privacy Policy</FooterLink></li>
              <li><FooterLink to="/terms">Terms of Service</FooterLink></li>

            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} NxteVia, Inc. All rights reserved.</p>
          <p className="text-slate-600">Designed by Dhrumil Waghela and Vipul Charugundla</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>

          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="text-slate-400 hover:text-white transition-colors hover:translate-x-0.5 inline-block duration-200">
      {children}
    </Link>
  );
}

function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-primary hover:text-white transition-all duration-300"
      aria-label={label}
    >
      {icon}
    </a>
  );
}
