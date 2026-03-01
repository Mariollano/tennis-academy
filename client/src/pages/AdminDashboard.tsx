import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users, Calendar, DollarSign, MessageSquare, CheckCircle,
  Clock, XCircle, Send, Trophy, BarChart3, Shield
} from "lucide-react";
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

export default function AdminDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [bookingFilter, setBookingFilter] = useState("all");
  const [smsMessage, setSmsMessage] = useState("");
  const [activeTab, setActiveTab] = useState("bookings");

  const { data: stats } = trpc.admin.stats.useQuery(undefined, { enabled: user?.role === "admin" });
  const { data: bookings, refetch: refetchBookings } = trpc.booking.adminList.useQuery(
    { status: bookingFilter === "all" ? undefined : bookingFilter, limit: 50 },
    { enabled: user?.role === "admin" }
  );
  const { data: students } = trpc.admin.listStudents.useQuery(undefined, { enabled: user?.role === "admin" });
  const { data: broadcasts } = trpc.sms.getBroadcasts.useQuery(undefined, { enabled: user?.role === "admin" });
  const { data: smsCount } = trpc.sms.getOptInCount.useQuery(undefined, { enabled: user?.role === "admin" });

  const updateStatusMutation = trpc.booking.updateStatus.useMutation({
    onSuccess: () => { toast.success("Booking status updated!"); refetchBookings(); },
    onError: () => toast.error("Failed to update status."),
  });

  const sendSmsMutation = trpc.sms.sendBroadcast.useMutation({
    onSuccess: (data) => {
      toast.success(`SMS sent to ${data.recipientCount} subscribers!`);
      setSmsMessage("");
    },
    onError: () => toast.error("Failed to send SMS broadcast."),
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
          <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Admin Access Required</h2>
          <p className="text-muted-foreground mb-6">Please sign in with your admin account.</p>
          <Button className="bg-primary text-primary-foreground" onClick={() => (window.location.href = getLoginUrl())}>
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full text-center p-8">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-6">This area is restricted to academy admins.</p>
          <Link href="/"><Button variant="outline">Go Home</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-primary text-primary-foreground py-10">
        <div className="container">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 text-accent" />
            <Badge className="bg-accent/20 text-accent border-accent/30">Admin Dashboard</Badge>
          </div>
          <h1 className="text-3xl font-extrabold">RI Tennis Academy — Control Center</h1>
          <p className="text-primary-foreground/70 mt-1">Welcome back, {user?.name?.split(" ")[0] || "Coach Mario"}</p>
        </div>
      </section>

      <div className="container py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Students", value: stats?.totalStudents ?? "—", icon: <Users className="w-5 h-5" />, color: "text-blue-600", tab: "students", hint: "View all students" },
            { label: "Total Bookings", value: stats?.totalBookings ?? "—", icon: <Calendar className="w-5 h-5" />, color: "text-green-600", tab: "bookings", hint: "View all bookings" },
            { label: "Pending Bookings", value: stats?.pendingBookings ?? "—", icon: <Clock className="w-5 h-5" />, color: "text-amber-600", tab: "bookings", hint: "View pending bookings", filter: "pending" },
            { label: "SMS Subscribers", value: stats?.smsSubscribers ?? "—", icon: <MessageSquare className="w-5 h-5" />, color: "text-purple-600", tab: "sms", hint: "Go to SMS broadcast" },
          ].map((stat) => (
            <Card
              key={stat.label}
              className="border border-border cursor-pointer hover:shadow-md hover:border-primary/40 transition-all group"
              onClick={() => {
                if (stat.filter) setBookingFilter(stat.filter);
                setActiveTab(stat.tab);
                setTimeout(() => document.getElementById('admin-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
              }}
            >
              <CardContent className="p-4">
                <div className={`${stat.color} mb-2 flex items-center justify-between`}>
                  {stat.icon}
                  <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity font-medium">{stat.hint} →</span>
                </div>
                <div className="text-2xl font-extrabold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div id="admin-tabs" />
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex flex-wrap gap-1 h-auto bg-muted p-1 rounded-xl">
            <TabsTrigger value="bookings" onClick={() => setActiveTab("bookings")}><Calendar className="w-4 h-4 mr-1.5" />Bookings</TabsTrigger>
            <TabsTrigger value="students" onClick={() => setActiveTab("students")}><Users className="w-4 h-4 mr-1.5" />Students</TabsTrigger>
            <TabsTrigger value="sms" onClick={() => setActiveTab("sms")}><MessageSquare className="w-4 h-4 mr-1.5" />SMS Broadcast</TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" /> All Bookings
                  </CardTitle>
                  <Select value={bookingFilter} onValueChange={setBookingFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {!bookings || bookings.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    No bookings found.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings.map((item) => (
                      <div key={item.booking.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-border rounded-xl gap-3 hover:bg-muted/20 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-foreground text-sm capitalize">
                              {item.booking.programId ? `Program #${item.booking.programId}` : "Booking"}
                            </span>
                            <Badge className={`text-xs ${statusColors[item.booking.status]}`}>
                              {item.booking.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium">{item.user?.name || "Unknown"}</span>
                            {item.user?.email && <span className="ml-2">{item.user.email}</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {item.booking.sessionDate
                              ? `Session: ${new Date(item.booking.sessionDate).toLocaleDateString()}`
                              : `Booked: ${new Date(item.booking.createdAt).toLocaleDateString()}`}
                            {item.booking.notes && <span className="ml-2 italic">— {item.booking.notes}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-bold text-primary">
                            ${((item.booking.totalAmountCents || 0) / 100).toFixed(0)}
                          </span>
                          <div className="flex gap-1">
                            {item.booking.status === "pending" && (
                              <>
                                <Button size="sm" className="bg-green-600 text-white hover:bg-green-700 h-7 text-xs px-2"
                                  onClick={() => updateStatusMutation.mutate({ id: item.booking.id, status: "confirmed" })}>
                                  <CheckCircle className="w-3 h-3 mr-1" /> Confirm
                                </Button>
                                <Button size="sm" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50 h-7 text-xs px-2"
                                  onClick={() => updateStatusMutation.mutate({ id: item.booking.id, status: "cancelled" })}>
                                  <XCircle className="w-3 h-3 mr-1" /> Cancel
                                </Button>
                              </>
                            )}
                            {item.booking.status === "confirmed" && (
                              <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 h-7 text-xs px-2"
                                onClick={() => updateStatusMutation.mutate({ id: item.booking.id, status: "completed" })}>
                                <CheckCircle className="w-3 h-3 mr-1" /> Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" /> Student Directory
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!students || students.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    No students registered yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Name</th>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Email</th>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Phone</th>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">SMS</th>
                          <th className="text-left py-2 px-3 text-muted-foreground font-medium">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student.id} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="py-2.5 px-3 font-medium text-foreground">{student.name || "—"}</td>
                            <td className="py-2.5 px-3 text-muted-foreground">{student.email || "—"}</td>
                            <td className="py-2.5 px-3 text-muted-foreground">{(student as any).phone || "—"}</td>
                            <td className="py-2.5 px-3">
                              {(student as any).smsOptIn ? (
                                <Badge className="bg-green-100 text-green-800 text-xs">Opted In</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">No</Badge>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-muted-foreground text-xs">
                              {new Date(student.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* SMS Broadcast Tab */}
          <TabsContent value="sms">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-primary" /> Send SMS Broadcast
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-primary/5 rounded-lg p-4 flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <div>
                      <div className="font-semibold text-foreground">{smsCount?.count || 0} Subscribers</div>
                      <div className="text-xs text-muted-foreground">Students opted in to receive SMS</div>
                    </div>
                  </div>

                  <div>
                    <Label>Message</Label>
                    <Textarea
                      value={smsMessage}
                      onChange={(e) => setSmsMessage(e.target.value)}
                      placeholder="Type your message to all opted-in students... (e.g., 'Hi everyone! Court 3 is open today at 4:30 PM. See you out there! — Coach Mario')"
                      rows={5}
                      maxLength={1600}
                    />
                    <div className="text-xs text-muted-foreground mt-1 text-right">{smsMessage.length}/1600</div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                    <strong>Note:</strong> Messages will only be sent to students who have opted in to SMS notifications and have a phone number on file. To enable actual SMS delivery, configure your Twilio credentials in Settings.
                  </div>

                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => sendSmsMutation.mutate({ message: smsMessage })}
                    disabled={!smsMessage.trim() || sendSmsMutation.isPending}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {sendSmsMutation.isPending ? "Sending..." : `Send to ${smsCount?.count || 0} Subscribers`}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Broadcasts</CardTitle>
                </CardHeader>
                <CardContent>
                  {!broadcasts || broadcasts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      No broadcasts sent yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {broadcasts.map((b) => (
                        <div key={b.id} className="p-3 border border-border rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <Badge className={b.status === "sent" ? "bg-green-100 text-green-800 text-xs" : "bg-muted text-muted-foreground text-xs"}>
                              {b.status}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {b.sentAt ? new Date(b.sentAt).toLocaleDateString() : "Draft"}
                            </span>
                          </div>
                          <p className="text-sm text-foreground line-clamp-2">{b.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{b.recipientCount} recipients</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
