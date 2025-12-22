import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { Mail, MapPin, Send, MessageSquare, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import { useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function Contact() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Invoke Supabase Edge Function to send email
            const { data, error } = await supabase.functions.invoke('send-contact-email', {
                body: { record: formData }
            });

            if (error) throw error;

            toast.success("Message sent successfully!", {
                description: "We'll get back to you as soon as possible."
            });

            setFormData({ name: "", email: "", subject: "", message: "" });
        } catch (error: any) {
            console.error('Error submitting contact form:', error);

            // Helpful error for development if function is missing
            if (error.message?.includes("FunctionsFetchError")) {
                toast.error("System Error", {
                    description: "The email service is not currently active. Please try again later."
                });
            } else {
                toast.error("Failed to send message", {
                    description: error.message || "Please try again later or email us directly."
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    return (
        <Layout>
            <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
                {/* Hero Section */}
                <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
                    {/* Animated Gradient Mesh */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 dark:opacity-50">
                        <div className="absolute top-0 left-0 w-[60vw] h-[60vw] bg-indigo-200 dark:bg-indigo-500/20 rounded-full blur-[100px] animate-blob" />
                        <div className="absolute bottom-0 right-0 w-[60vw] h-[60vw] bg-purple-200 dark:bg-purple-500/20 rounded-full blur-[100px] animate-blob animation-delay-2000" />
                    </div>

                    <div className="container relative z-10 px-4 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        >
                            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-slate-50/50 dark:bg-slate-900/10 border border-slate-200 dark:border-slate-800 mb-8 backdrop-blur-sm shadow-sm">
                                <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">Get in Touch</span>
                            </div>

                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white mb-6">
                                Let's Build the <br className="hidden md:block" /> Future <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">Together.</span>
                            </h1>
                            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
                                Have a question, partnership idea, or just want to say hello? We'd love to hear from you.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Contact Content */}
                <section className="relative py-24 -mt-20">
                    <div className="container max-w-6xl relative z-20">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">

                            {/* Contact Info (Left) */}
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6 }}
                                className="space-y-12"
                            >
                                <div>
                                    <Badge variant="outline" className="mb-4 border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700/50 dark:text-slate-300 dark:bg-slate-800/50 px-4 py-1 text-xs uppercase tracking-wider font-semibold">Contact Info</Badge>
                                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Reach Out to Us</h2>
                                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                                        We are always open to discussing new projects, creative ideas, or opportunities to be part of your visions.
                                    </p>
                                </div>

                                <div className="space-y-8">
                                    <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm group hover:bg-white dark:hover:bg-slate-900 transition-colors">
                                        <CardContent className="p-6 flex items-start gap-6">
                                            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                                                <Mail className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Email Us</h3>
                                                <p className="text-slate-500 dark:text-slate-400 mb-2">Our friendly team is here to help.</p>
                                                <a href="mailto:support@NxteVia.com" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline text-lg">support@NxteVia.com</a>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="border-0 shadow-lg shadow-slate-200/50 dark:shadow-none bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm group hover:bg-white dark:hover:bg-slate-900 transition-colors">
                                        <CardContent className="p-6 flex items-start gap-6">
                                            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300">
                                                <MapPin className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Location</h3>
                                                <p className="text-slate-500 dark:text-slate-400 mb-2">Come say hello at our office HQ.</p>
                                                <p className="text-slate-900 dark:text-slate-200 font-medium text-lg">
                                                    Toronto, Ontario, Canada
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </motion.div>

                            {/* Contact Form (Right) */}
                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                <Card className="border-slate-200 dark:border-slate-800 shadow-2xl dark:shadow-none bg-white dark:bg-slate-900/80 backdrop-blur-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 dark:bg-indigo-900/10 rounded-bl-[100px] -z-10" />

                                    <CardContent className="p-8 md:p-10">
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Send us a message</h2>
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <Label htmlFor="name">Full Name</Label>
                                                    <Input
                                                        id="name"
                                                        value={formData.name}
                                                        onChange={handleChange}
                                                        placeholder="John Doe"
                                                        className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="email">Email Address</Label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        placeholder="john@example.com"
                                                        className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="subject">Subject</Label>
                                                <Input
                                                    id="subject"
                                                    value={formData.subject}
                                                    onChange={handleChange}
                                                    placeholder="How can we help?"
                                                    className="bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="message">Message</Label>
                                                <Textarea
                                                    id="message"
                                                    value={formData.message}
                                                    onChange={handleChange}
                                                    placeholder="Tell us about your project..."
                                                    className="min-h-[150px] bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 resize-none"
                                                    required
                                                />
                                            </div>

                                            <Button
                                                type="submit"
                                                disabled={loading}
                                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold h-12 text-lg shadow-lg hover:shadow-indigo-500/25 transition-all"
                                            >
                                                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                                                {loading ? "Sending..." : "Send Message"}
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </div>
                </section>
            </div>
        </Layout>
    );
}
