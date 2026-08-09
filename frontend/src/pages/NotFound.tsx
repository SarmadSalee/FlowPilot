import { Link } from "react-router-dom";
import { Workflow, Home } from "lucide-react";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base px-6 text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary-soft text-white">
        <Workflow className="size-7 text-white" />
      </div>
      <p className="font-display text-7xl font-bold text-gradient">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-ink">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-dim">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary btn-md mt-8">
        <Home className="size-4" /> Back to home
      </Link>
    </div>
  );
}