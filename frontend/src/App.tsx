import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import useAuth from "@/store/auth";
import AppLayout from "@/components/layout/AppLayout";
import Landing from "@/pages/Landing";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import Legal from "@/pages/Legal";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/Dashboard";
import Workflows from "@/pages/Workflows";
import WorkflowBuilder from "@/pages/WorkflowBuilder";
import AICreator from "@/pages/AICreator";
import Agents from "@/pages/Agents";
import Leads from "@/pages/Leads";
import LeadDetail from "@/pages/LeadDetail";
import LeadRules from "@/pages/LeadRules";
import Integrations from "@/pages/Integrations";
import Executions from "@/pages/Executions";
import ExecutionDetail from "@/pages/ExecutionDetail";
import Analytics from "@/pages/Analytics";
import Templates from "@/pages/Templates";
import Team from "@/pages/Team";
import Settings from "@/pages/Settings";
import Billing from "@/pages/Billing";
import NotFound from "@/pages/NotFound";

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-base">
      <Loader2 className="size-7 animate-spin text-primary" />
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const loc = useLocation();
  if (!ready) return <Splash />;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return <>{children}</>;
}

function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <Splash />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <Login />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfAuthed>
            <Register />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <RedirectIfAuthed>
            <ForgotPassword />
          </RedirectIfAuthed>
        }
      />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/legal/:slug" element={<Legal />} />
      <Route path="/legal" element={<Legal />} />

      {/* App */}
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/workflows" element={<Workflows />} />
        <Route path="/workflows/:id" element={<WorkflowBuilder />} />
        <Route path="/ai/create" element={<AICreator />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/leads/rules" element={<LeadRules />} />
        <Route path="/leads/:id" element={<LeadDetail />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/executions" element={<Executions />} />
        <Route path="/executions/:id" element={<ExecutionDetail />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/team" element={<Team />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/billing" element={<Billing />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}