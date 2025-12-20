import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { createTicket, TICKET_CATEGORIES, TicketCategory } from "@/lib/tickets";
import { X } from "lucide-react";

interface TicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  userRole: "student" | "company" | "admin";
  userId: string;
}

export function TicketModal({
  open,
  onOpenChange,
  userName,
  userRole,
  userId,
}: TicketModalProps) {
  const [category, setCategory] = React.useState<TicketCategory>("general");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const close = React.useCallback(() => onOpenChange(false), [onOpenChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await createTicket(category, title.trim(), description.trim(), {
        id: userId,
        name: userName,
        role: userRole,
      });
      toast({
        title: "Ticket created",
        description: "Your support ticket has been submitted successfully.",
      });
      setTitle("");
      setDescription("");
      setCategory("general");
      close();
    } catch (e) {
      console.error("Ticket creation failed", e);
      toast({
        title: "Error",
        description: "Failed to create ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Create Support Ticket</CardTitle>
          <button
            onClick={close}
            className="rounded hover:bg-muted p-1"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as TicketCategory)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {TICKET_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Subject</Label>
              <Input
                id="title"
                placeholder="Brief description of your issue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Please provide detailed information about your issue"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Ticket"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={close}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
