"use client";
import { Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import usePathname from "@/components/client/pathname";
import { submitBugReport } from "@/lib/feedback/submitBugReport";
import { useCookieBannerMetrics } from "@/components/global/CookieBannerContext";

export default function ReportErrorButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [bugType, setBugType] = useState("Website Article Errors");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const { visible: bannerVisible, height: bannerHeight } = useCookieBannerMetrics();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedEmail = email.trim();
    if (!trimmedTitle || !trimmedDescription || !trimmedEmail) {
      setStatus("error");
      return;
    }

    setStatus("loading");
    try {
      const bugUrl = `${window.location.origin}${pathname}`; // captured, never shown to the user

      await submitBugReport({
        title: trimmedTitle,
        bugType,
        bugUrl,
        message: trimmedDescription,
        email: trimmedEmail,
        attachedImage,
      });

      setStatus("success");
      setTimeout(() => {
        setOpen(false);
        setStatus("idle");
        setTitle("");
        setDescription("");
        setEmail("");
        setAttachedImage(null);
        setBugType("Website Article Errors");
      }, 1200);
    } catch (err) {
      console.error("Error submitting error report:", err);
      setStatus("error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          style={bannerVisible ? { bottom: bannerHeight + 16 } : undefined}
          className={`fixed right-4 z-40 bg-yellow-500 shadow-lg hover:bg-yellow-600 ${
            bannerVisible ? "" : "bottom-16"
          }`}
        >
          <Bug className="opacity-70" />
          <span className="hidden sm:inline">Report an Error</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report an Error</DialogTitle>
        </DialogHeader>

        {status === "success" ? (
          <p className="text-sm text-green-700">
            Thanks! Your report has been submitted.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="report-title">Title</Label>
              <Input
                id="report-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Short summary of the issue"
              />
            </div>
            <div>
              <Label htmlFor="report-bugtype">
                What kind of issue is this?
              </Label>
              <select
                id="report-bugtype"
                value={bugType}
                onChange={(e) => setBugType(e.target.value)}
                className="w-full rounded-md border bg-gray-50 p-2 text-gray-900"
              >
                <option value="Website Article Errors">
                  Website Article Errors
                </option>
                <option value="Unit Test Errors">Unit Test Errors</option>
                <option value="Mock Exam Errors">Mock Exam Errors</option>
                <option value="Website Bugs">Website Bugs</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <Label htmlFor="report-description">Describe the issue</Label>
              <Textarea
                id="report-description"
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What went wrong?"
              />
            </div>
            <div>
              <Label htmlFor="report-screenshot">
                Attach Screenshot (Optional)
              </Label>
              <Input
                id="report-screenshot"
                type="file"
                accept="image/*"
                onChange={(e) => setAttachedImage(e.target.files?.[0] ?? null)}
              />
            </div>
            <div>
              <Label htmlFor="report-email">Your Email *</Label>
              <Input
                id="report-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="apstudent@example.com"
              />
            </div>
            {status === "error" && (
              <p className="text-sm text-red-600">
                Something went wrong. Please try again.
              </p>
            )}
            <Button
              type="submit"
              disabled={status === "loading"}
              className="w-full"
            >
              {status === "loading" ? "Submitting..." : "Submit Report"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
