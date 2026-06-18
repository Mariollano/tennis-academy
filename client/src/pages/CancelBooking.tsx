import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2, AlertTriangle, Calendar, Clock } from "lucide-react";

export default function CancelBooking() {
  const [, navigate] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    setToken(t);
  }, []);

  const { data: booking, isLoading, error } = trpc.user.getByToken.useQuery(
    { token: token! },
    { enabled: !!token }
  );

  const cancelMutation = trpc.user.cancelByToken.useMutation({
    onSuccess: () => setConfirmed(true),
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Invalid Link</h2>
            <p className="text-muted-foreground">This cancellation link is missing a token. Please use the link from your confirmation email.</p>
            <Button className="mt-6" onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Link Not Found</h2>
            <p className="text-muted-foreground">This cancellation link is invalid or has already been used. If you need help, contact Coach Mario at (401) 965-5873.</p>
            <Button className="mt-6" onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (booking.status === "cancelled") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Already Cancelled</h2>
            <p className="text-muted-foreground">This booking has already been cancelled.</p>
            <Button className="mt-6" variant="outline" onClick={() => navigate("/")}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
          <CardContent className="pt-8 pb-8 text-center">
            <CheckCircle className="w-14 h-14 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-green-800 dark:text-green-200">Booking Cancelled</h2>
            <p className="text-green-700 dark:text-green-300 mb-4">
              Your booking for <strong>{booking.programName}</strong> has been cancelled successfully.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              If you paid by card and would like a refund, please contact Coach Mario at{" "}
              <a href="tel:4019655873" className="font-semibold underline">(401) 965-5873</a> or{" "}
              <a href="mailto:ritennismario@gmail.com" className="font-semibold underline">ritennismario@gmail.com</a>.
            </p>
            <Button onClick={() => navigate("/")}>Back to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-2">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-7 h-7 text-red-600" />
          </div>
          <CardTitle className="text-xl">Cancel Your Booking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Booking details */}
          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <p className="font-semibold text-base">{booking.programName}</p>
            {booking.sessionDate && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 shrink-0" />
                {booking.sessionDate}
              </div>
            )}
            {booking.sessionTime && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 shrink-0" />
                {booking.sessionTime}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 font-medium capitalize">
                {booking.status}
              </span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Are you sure you want to cancel this booking? This action cannot be undone.
          </p>

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/")}
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={cancelMutation.isPending}
              onClick={() => cancelMutation.mutate({ token: token! })}
            >
              {cancelMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Cancelling...</>
              ) : (
                "Yes, Cancel"
              )}
            </Button>
          </div>

          {cancelMutation.error && (
            <p className="text-sm text-destructive text-center">{cancelMutation.error.message}</p>
          )}

          <p className="text-xs text-muted-foreground text-center pt-1">
            Need help? Contact Coach Mario at{" "}
            <a href="tel:4019655873" className="underline">(401) 965-5873</a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
