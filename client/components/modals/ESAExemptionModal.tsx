import * as React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ESAExemptionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onVerify: () => void;
}

export function ESAExemptionModal({ open, onOpenChange, onVerify }: ESAExemptionModalProps) {
    const [selectedOption, setSelectedOption] = React.useState<string>("");

    const handleVerify = () => {
        if (selectedOption === "A" || selectedOption === "B") {
            onVerify();
        }
    };

    // Reset state when modal opens
    React.useEffect(() => {
        if (open) {
            setSelectedOption("");
        }
    }, [open]);

    const isOptionC = selectedOption === "C";
    const canVerify = (selectedOption === "A" || selectedOption === "B");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        MANDATORY COMPLIANCE DECLARATION: UNPAID POSITION
                    </DialogTitle>
                    <DialogDescription className="text-base text-slate-700 dark:text-slate-300 mt-2">
                        You have indicated this is an unpaid opportunity. Under the <strong>Employment Standards Act, 2000 (Ontario)</strong>, unpaid internships are strictly regulated and are generally prohibited unless they fall under a specific statutory exemption.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-2">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400">
                        <p>
                            By posting this opportunity, you acknowledge that simply calling a position an "internship" or "training" does not legally exempt you from paying minimum wage. You must attest that this position meets one of the following strict legal criteria:
                        </p>
                    </div>

                    <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="space-y-4">
                        <div className={cn("flex items-start space-x-3 space-y-0 rounded-md border p-4 transition-colors", selectedOption === "A" ? "border-primary bg-primary/5" : "border-slate-200 dark:border-slate-800")}>
                            <RadioGroupItem value="A" id="option-a" className="mt-1" />
                            <div className="space-y-1">
                                <Label htmlFor="option-a" className="font-bold text-slate-900 dark:text-white cursor-pointer">
                                    Option A: Student Co-op / Educational Practicum (ESA s. 3(5))
                                </Label>
                                <div className="text-sm text-slate-600 dark:text-slate-400 pl-1 space-y-1">
                                    <p>I certify that this position is a work experience program authorized by a secondary school board, college of applied arts and technology, or university.</p>
                                    <ul className="list-disc pl-5 space-y-1 pt-1">
                                        <li>I confirm the intern will receive academic credit or school recognition for this placement.</li>
                                        <li>I acknowledge I am responsible for retaining school-issued approval documents.</li>
                                        <li>I confirm this is not merely an internship for "experience" without academic integration.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className={cn("flex items-start space-x-3 space-y-0 rounded-md border p-4 transition-colors", selectedOption === "B" ? "border-primary bg-primary/5" : "border-slate-200 dark:border-slate-800")}>
                            <RadioGroupItem value="B" id="option-b" className="mt-1" />
                            <div className="space-y-1">
                                <Label htmlFor="option-b" className="font-bold text-slate-900 dark:text-white cursor-pointer">
                                    Option B: Regulated Profession (ESA s. 3(2))
                                </Label>
                                <div className="text-sm text-slate-600 dark:text-slate-400 pl-1">
                                    <p>I certify that this placement is a legal requirement for a specific regulated profession (e.g., Law, Architecture, Professional Engineering, Public Accounting).</p>
                                    <ul className="list-disc pl-5 space-y-1 pt-1">
                                        <li>I confirm the training provided meets the specific requirements of the governing professional body.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className={cn("flex items-start space-x-3 space-y-0 rounded-md border p-4 transition-colors", isOptionC ? "border-destructive/50 bg-destructive/5" : "border-slate-200 dark:border-slate-800")}>
                            <RadioGroupItem value="C" id="option-c" className="mt-1" />
                            <div className="space-y-1">
                                <Label htmlFor="option-c" className="font-bold text-slate-900 dark:text-white cursor-pointer">
                                    Option C: Trainee / General Internship
                                </Label>
                                <div className="text-sm text-slate-600 dark:text-slate-400 pl-1">
                                    <p>This position is for training or experience but is not part of a formal school program or regulated profession.</p>
                                </div>
                            </div>
                        </div>
                    </RadioGroup>

                    {isOptionC && (
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <div className="text-sm font-medium">
                                Based on Ontario employment laws, the "Trainee" exclusion is extremely narrow. If your company derives any benefit from the worker, you must pay at least minimum wage. You cannot post this as an unpaid role on NxteVia. Please update the Stipend field to meet statutory minimums.
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button
                        onClick={handleVerify}
                        disabled={!canVerify}
                        className={cn(canVerify ? "bg-primary" : "bg-slate-300 dark:bg-slate-700")}
                    >
                        I Attest & Verify
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
