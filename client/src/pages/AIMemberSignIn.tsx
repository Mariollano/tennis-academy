import * as React from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { MemberSignInForm } from "./AIMembers";

export default function AIMemberSignIn() {
  const [token] = React.useState(() => new URLSearchParams(window.location.hash.replace(/^#/, "")).get("token") || "");
  const signIn = trpc.aiMembership.account.signIn.useMutation({ onSuccess: () => window.location.replace("/ai-members") });
  React.useEffect(() => {
    // Token stays in local component memory, not in URLs/referrers/analytics.
    window.history.replaceState({}, "", window.location.pathname);
  }, []);
  return (
    <div className="container min-h-[65vh] py-14">
      <section className="max-w-xl rounded-2xl border border-border bg-card p-7 text-card-foreground">
        <h1 className="mb-4 text-3xl font-bold" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Sign in to your member library</h1>
        {token ? <><p className="mb-6 text-muted-foreground">Use your private email link to continue. This link can only be used once.</p><Button disabled={signIn.isPending} onClick={() => signIn.mutate({ token })}>{signIn.isPending ? "Signing in…" : "Sign in and open my library"}</Button>{signIn.error && <p role="alert" className="mt-4 text-sm text-red-700">{signIn.error.message}</p>}</> : <p className="text-muted-foreground">Request a private sign-in link below using the email you paid with.</p>}
        {(!token || signIn.error) && <MemberSignInForm />}
        <p className="mt-6 text-sm"><a href="/ai-members" className="underline">Back to member library</a></p>
      </section>
    </div>
  );
}
