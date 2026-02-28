import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { User, Phone, Bell, Calendar, CheckCircle, Clock, XCircle, MessageSquare } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-3.5 h-3.5" />,
  confirmed: <CheckCircle className="w-3.5 h-3.5" />,
  cancelled: <XCircle className="w-3.5 h-3.5" />,
  completed: <CheckCircle className="w-3.5 h-3.5" />,
};

export default function Profile() {
  const { user, isAuthenticated, loading } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone((user as any).phone || "");
      setSmsOptIn((user as any).smsOptIn || false);
    }
  }, [user]);

  const { data: bookings, isLoading: bookingsLoading } = trpc.user.getMyBookings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      setSaved(true);
      toast.success("Profile updated successfully!");
      setTimeout(() => setSaved(false), 3000);
    },
    onError: () => toast.error("Failed to update profile."),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center p-8">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-6">Please sign in to view your profile and bookings.</p>
          <Button
            className="bg-primary text-primary-foreground"
            onClick={() => (window.location.href = getLoginUrl())}
          >
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-2xl font-bold text-accent-foreground">
              {user?.name?.charAt(0) || "?"}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{user?.name || "My Profile"}</h1>
              <p className="text-primary-foreground/70 text-sm">{user?.email}</p>
              <Badge className="mt-1 bg-accent/20 text-accent border-accent/30 text-xs capitalize">
                {user?.role === "admin" ? "Coach / Admin" : "Student"}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Settings */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5 text-primary" /> Profile Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </div>
                <div>
                  <Label className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> Phone Number
                  </Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (401) 555-0000" type="tel" />
                  <p className="text-xs text-muted-foreground mt-1">Required for SMS updates</p>
                </div>

                <Separator />

                {/* SMS Opt-In */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="flex items-center gap-1.5 font-semibold">
                        <MessageSquare className="w-4 h-4 text-primary" /> SMS Updates
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Daily updates, schedule changes & motivational messages from Coach Mario
                      </p>
                    </div>
                    <Switch
                      checked={smsOptIn}
                      onCheckedChange={setSmsOptIn}
                      disabled={!phone}
                    />
                  </div>
                  {smsOptIn && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800 flex items-start gap-2">
                      <Bell className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      You'll receive SMS updates from Coach Mario. You can opt out anytime.
                    </div>
                  )}
                  {!phone && (
                    <p className="text-xs text-amber-600">Add a phone number to enable SMS updates.</p>
                  )}
                </div>

                <Button
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => updateProfileMutation.mutate({ name, phone, smsOptIn })}
                  disabled={updateProfileMutation.isPending}
                >
                  {saved ? <><CheckCircle className="w-4 h-4 mr-1" /> Saved!</> : "Save Changes"}
                </Button>
              </CardContent>
            </Card>

            {user?.role === "admin" && (
              <Card className="border-accent bg-accent/5">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-foreground mb-2">Admin Access</h3>
                  <p className="text-sm text-muted-foreground mb-3">You have admin access to manage the academy.</p>
                  <Link href="/admin">
                    <Button className="w-full bg-primary text-primary-foreground">Go to Admin Dashboard</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Bookings */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-primary" /> My Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bookingsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : !bookings || bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">No bookings yet.</p>
                    <Link href="/programs">
                      <Button className="bg-primary text-primary-foreground">Browse Programs</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-muted/30 transition-colors">
                        <div>
                          <div className="font-semibold text-foreground text-sm capitalize">
                            {booking.programId ? `Program #${booking.programId}` : "Booking"}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {booking.sessionDate
                              ? new Date(booking.sessionDate).toLocaleDateString()
                              : new Date(booking.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-primary text-sm">
                            ${((booking.totalAmountCents || 0) / 100).toFixed(0)}
                          </span>
                          <Badge className={`text-xs flex items-center gap-1 ${statusColors[booking.status] || "bg-muted text-muted-foreground"}`}>
                            {statusIcons[booking.status]}
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
