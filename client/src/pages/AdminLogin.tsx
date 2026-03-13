import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [, navigate] = useLocation();

  const loginMutation = trpc.auth.adminLogin.useMutation({
    onSuccess: () => {
      toast.success("Welcome, Coach Mario!");
      // Force full reload so the auth context picks up the new cookie
      window.location.href = "/admin";
    },
    onError: (err) => {
      toast.error(err.message || "Incorrect password");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim()) return;
    loginMutation.mutate({ password });
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-primary px-8 py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-accent/20 border-2 border-accent/40 flex items-center justify-center mx-auto mb-3">
              <Shield className="w-7 h-7 text-accent" />
            </div>
            <h1 className="text-xl font-bold text-primary-foreground">Admin Access</h1>
            <p className="text-primary-foreground/60 text-sm mt-1">RI Tennis Academy</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-7 space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  autoFocus
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPw(v => !v)}
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-accent text-accent-foreground hover:brightness-105 font-bold rounded-xl"
              disabled={loginMutation.isPending || !password.trim()}
            >
              {loginMutation.isPending ? "Signing in…" : "Enter Dashboard"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Only Coach Mario has access to this page.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
