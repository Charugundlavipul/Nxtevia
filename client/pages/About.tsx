import Layout from "@/components/Layout";
import { Seo } from "@/components/site/Seo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion, useScroll, useTransform } from "framer-motion";
import { Target, Globe, Users, Lightbulb, Sparkles, Flag, Crown } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";

// --- Components ---

const HeroSection = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
      {/* Animated Gradient Mesh Background - Subtler for Light Mode */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30 dark:opacity-40">
        <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-purple-200 dark:bg-purple-500/20 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80vw] h-[80vw] bg-indigo-200 dark:bg-indigo-500/20 rounded-full blur-[120px] animate-blob animation-delay-2000" />
      </div>

      <div className="container relative z-10 px-4 md:px-0">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20 mb-8 backdrop-blur-sm shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">About NxteVia</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-8 leading-tight">
            Driven by <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
              Real Impact.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 leading-relaxed font-light max-w-3xl mx-auto">
            NxteVia Inc. is a founder-led company built by visionaries. We design intelligent,
            future-ready digital platforms that connect <span className="text-slate-900 dark:text-white font-medium">opportunity with potential</span>.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

const VisionMissionSection = () => {
  return (
    <section className="relative bg-white dark:bg-slate-950 py-24 md:py-32 overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />

      <div className="container max-w-5xl relative z-10">

        {/* Vision Block - "Hero Typography" (Reduced Size) */}
        <div className="mb-24 text-center relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20 mb-8 backdrop-blur-sm shadow-sm">
              <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">Our Vision</span>
            </div>

            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-[1.2] tracking-tight">
              Empowering every <br className="hidden md:block" /> individual to
              <span className="relative inline-block px-4 mx-2">
                <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                  grow
                </span>
                <div className="absolute inset-0 bg-indigo-100 dark:bg-indigo-500/10 -rotate-2 rounded-lg -z-10" />
              </span>
              through <br className="hidden md:block" />
              real-world experience.
            </h2>
          </motion.div>
        </div>

        {/* Mission Block - "Vertical Timeline" */}
        <div className="relative">
          {/* Center Timeline Line */}
          <div className="absolute left-8 md:left-1/2 top-12 bottom-0 w-px bg-gradient-to-b from-indigo-500/50 via-purple-500/50 to-transparent md:-translate-x-1/2" />

          <div className="text-center mb-16 relative z-10">
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-500/20 backdrop-blur-sm shadow-sm">
              <Flag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-bold text-purple-700 dark:text-purple-300 uppercase tracking-widest">Our Mission</span>
            </div>
          </div>

          <div className="relative">
            {/* Connector Line (Desktop) */}
            <div className="hidden md:block absolute top-[2.5rem] left-0 right-0 h-0.5 border-t-2 border-dashed border-indigo-200 dark:border-indigo-900/50" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center relative z-10">
              {[
                {
                  title: "Unlocking Opportunity",
                  icon: Globe,
                  text: "Making real-world experience accessible to everyone—building the confidence, networks, and skills needed to thrive."
                },
                {
                  title: "Bridging the Gap",
                  icon: Users,
                  text: "Seamlessly connecting students, newcomers, and career changers with the opportunities that define their future."
                },
                {
                  title: "Driving Growth",
                  icon: Lightbulb,
                  text: "Empowering organizations to discover fresh talent and spark innovation through meaningful, real-world collaboration."
                }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.2 }}
                  className="flex flex-col items-center group"
                >
                  {/* Icon on the Path */}
                  <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-900 shadow-xl border-4 border-slate-50 dark:border-slate-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 group-hover:scale-110 group-hover:border-indigo-100 dark:group-hover:border-indigo-900 transition-all duration-300 relative z-20">
                    <item.icon className="w-8 h-8" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs mx-auto text-base">
                    {item.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const LeadershipSection = () => {
  const leadership = [
    {
      name: "Sabia Malhotra",
      role: "Co-Founder & CEO",
      bio: "Sabia is the Co-Founder and Chief Executive Officer of NxteVia. NxteVia was born from Sabia’s firsthand experience seeing how difficult it can be for talented individuals to access their first real-world opportunities—and for organizations to find motivated, fresh talent. She founded NxteVia to close that gap by creating a platform that connects experience seekers with forward-thinking organizations willing to invest in potential. Before launching NxteVia, Sabia built a diverse career across fintech, banking, and risk management. While working in fintech, she gained hands-on experience in product development, shaping her startup mindset and passion for building impact-driven solutions.",
      initials: "SM"
    },
    {
      name: "Hussain Noor",
      role: "Co-Founder & COO",
      bio: "Hussain is the Co-Founder and Chief Operating Officer of NxteVia. NxteVia was born from Hussain’s firsthand experience seeing how capable, motivated professionals are often overlooked by traditional hiring processes—and how organizations struggle to assess real-world ability beyond resumes and interviews. He co-founded NxteVia to help close that gap by enabling individuals to demonstrate skills through meaningful, outcomes-based work, while giving organizations a clearer, more practical way to identify and engage proven talent. Before launching NxteVia, Hussain built a career spanning over a decade in strategic procurement, SaaS partnerships, vendor operations, and large-scale program delivery. He has led complex, cross-functional initiatives, negotiated enterprise technology agreements, and worked closely with senior stakeholders to drive efficiency, accountability, and measurable results. His background in operational leadership and project management brings rigor, scalability, and execution focus to NxteVia’s platform and partnerships.",
      initials: "HN"
    },
    {
      name: "Dhrumil Waghela",
      role: "Co-Founder & CPO",
      bio: "Dhrumil is the Chief Product Officer at Nxtevia Inc., where he leads product vision, strategy, and execution across the company’s digital platforms. He plays a key role in ensuring Nxtevia’s products simplify complexity through thoughtful design and strong technical alignment. With over six years of experience across SaaS, AI, FinTech, healthcare, insurance, and enterprise transformation, Dhrumil specializes in turning complex business challenges into scalable, user-centric solutions. He works closely with cross-functional teams to build products that are innovative, reliable, and impactful.",
      initials: "DW"
    }
  ];

  return (
    <section className="py-24 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 relative overflow-hidden">
      {/* Subtle Background Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-50 dark:bg-indigo-900/10 rounded-full blur-3xl -z-10" />

      <div className="container max-w-5xl">
        <div className="mb-20 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20 mb-8 backdrop-blur-sm shadow-sm">
            <Crown className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">Leadership</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">Our Leadership Team</h2>
          <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto mt-6 rounded-full" />
        </div>

        <div className="space-y-12">
          {leadership.map((leader, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
            >
              <Card className="group bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 overflow-hidden relative">
                {/* Top Accent Line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

                <CardContent className="p-8 md:p-10 flex flex-col md:flex-row gap-8 items-start relative z-10">
                  <div className="flex-shrink-0 mx-auto md:mx-0">
                    <div className="w-24 h-24 rounded-2xl bg-indigo-50 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 flex items-center justify-center transition-colors duration-300 shadow-inner">
                      <span className="text-3xl font-bold text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{leader.initials}</span>
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300 mb-1">{leader.name}</h3>
                      <p className="text-indigo-600 dark:text-indigo-400 font-medium text-lg">{leader.role}</p>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-justify opacity-90 group-hover:opacity-100 transition-opacity">
                      {leader.bio}
                    </p>
                  </div>

                  {/* Subtle corner decoration */}
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function About() {
  return (
    <Layout>
      <Seo
        title="About Us – NxteVia"
        description="NxteVia bridges the gap between education and employment by connecting ambitious talent with forward-thinking companies."
        canonical={window?.location?.href || ""}
      />
      <HeroSection />
      <VisionMissionSection />
      <LeadershipSection />
    </Layout>
  );
}
