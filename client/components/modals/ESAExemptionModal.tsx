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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle } from "lucide-react";

interface ESAExemptionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onVerify: () => void;
}

export function ESAExemptionModal({ open, onOpenChange, onVerify }: ESAExemptionModalProps) {
    const [scrolledToBottom, setScrolledToBottom] = React.useState(false);
    const [checked, setChecked] = React.useState(false);
    const contentRef = React.useRef<HTMLDivElement>(null);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        // Allow a small buffer (e.g. 5px) for browser rounding differences
        if (scrollHeight - scrollTop - clientHeight < 10) {
            setScrolledToBottom(true);
        }
    };

    const handleVerify = () => {
        if (scrolledToBottom && checked) {
            onVerify();
        }
    };

    // Reset state when modal opens
    React.useEffect(() => {
        if (open) {
            setScrolledToBottom(false);
            setChecked(false);
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-700">
                        <AlertTriangle className="h-5 w-5" />
                        Unpaid Opportunity: Legal Verification Required
                    </DialogTitle>
                    <DialogDescription>
                        You must verify that this opportunity qualifies for an exemption under the Ontario Employment Standards Act (ESA).
                    </DialogDescription>
                </DialogHeader>

                <div className="border rounded-md p-4 bg-slate-50 dark:bg-slate-900">
                    <ScrollArea
                        className="h-[300px] pr-4"
                        onScrollCapture={handleScroll} // Using capture to detect scroll on the viewport
                    >
                        <div
                            className="space-y-4 text-sm text-slate-700 dark:text-slate-300"
                            // We attach a raw onScroll listener to this div if ScrollArea doesn't bubble consistently,
                            // but standard div scrolling is safer for detection
                            style={{ maxHeight: "300px", overflowY: "auto" }}
                            onScroll={handleScroll}
                        >
                            <h3 className="font-bold text-slate-900 dark:text-white">ESA Student Exemption Criteria</h3>
                            <p>
                                Under the Ontario Employment Standards Act (ESA), an individual receiving training may be considered an "employee" unless certain conditions are met. However, there is a specific exemption for students in school-approved programs.
                            </p>
                            <p><strong>[Legal text TBD]</strong></p>
                            <p>
                                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                            </p>
                            <p>
                                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                            </p>
                            <p>
                                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
                            </p>
                            <p>
                                Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.
                            </p>
                            <p>
                                Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur.
                            </p>
                            <p className="font-semibold text-red-600 dark:text-red-400">
                                End of document. Please confirm below.
                            </p>
                        </div>
                    </ScrollArea>
                </div>

                <div className="space-y-4 py-2">
                    <div className="flex items-start space-x-2 pt-2">
                        <Checkbox
                            id="esa-terms"
                            checked={checked}
                            onCheckedChange={(c) => setChecked(c as boolean)}
                            disabled={!scrolledToBottom}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <label
                                htmlFor="esa-terms"
                                className={`text-sm font-medium leading-none ${!scrolledToBottom ? "text-slate-400 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                                I confirm this role qualifies under the Ontario ESA student exemption (school-approved program etc.).
                            </label>
                            {!scrolledToBottom && (
                                <p className="text-xs text-slate-500">Please scroll to the bottom of the text to enable.</p>
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleVerify} disabled={!scrolledToBottom || !checked}>
                        I Verify
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
