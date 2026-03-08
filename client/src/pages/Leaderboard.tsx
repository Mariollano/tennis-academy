import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Star, Zap, TrendingUp, Calendar, Users } from "lucide-react";

export default function Leaderboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"monthly" | "allTime">("monthly");

  const { data: monthly = [], isLoading: loadingMonthly } = trpc.leaderboard.monthly.useQuery();
  const { data: allTime = [], isLoading: loadingAllTime } = trpc.leaderboard.allTime.useQuery();
  const { data: stats } = trpc.leaderboard.stats.useQuery();
  const { data: myRank } = trpc.leaderboard.myRank.useQuery(
    { userId: user?.id },
    { enabled: !!user }
  );

  const data = tab === "monthly" ? monthly : allTime;
  const isLoading = tab === "monthly" ? loadingMonthly : loadingAllTime;

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <span className="text-2xl">🥇</span>;
    if (rank === 2) return <span className="text-2xl">🥈</span>;
    if (rank === 3) return <span className="text-2xl">🥉</span>;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/30";
    if (rank === 2) return "bg-gradient-to-r from-slate-400/10 to-slate-500/10 border-slate-400/30";
    if (rank === 3) return "bg-gradient-to-r from-orange-400/10 to-amber-600/10 border-orange-400/30";
    return "bg-card border-border";
  };

  const monthName = new Date().toLocaleString("default", { month: "long" });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0f1f5c] via-[#1a3a8f] to-[#0f1f5c] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <Trophy className="h-4 w-4 text-[#ccff00]" />
            <span>Community Leaderboard</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            TOP PLAYERS
          </h1>
          <p className="text-white/70 text-lg max-w-xl mx-auto mb-8">
            Who's putting in the most work on the court? See the most dedicated players at RI Tennis Academy.
          </p>
          {/* Stats bar */}
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-2xl font-black text-[#ccff00]">{stats?.totalSessions ?? "—"}</div>
              <div className="text-xs text-white/60 mt-1">Total Sessions</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-2xl font-black text-[#ccff00]">{stats?.totalStudents ?? "—"}</div>
              <div className="text-xs text-white/60 mt-1">Active Players</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <div className="text-2xl font-black text-[#ccff00]">{stats?.thisMonthSessions ?? "—"}</div>
              <div className="text-xs text-white/60 mt-1">This Month</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* My rank card */}
        {user && myRank && (
          <div className="mb-8 bg-gradient-to-r from-[#1a3a8f]/10 to-[#ccff00]/10 border border-[#1a3a8f]/20 rounded-2xl p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#1a3a8f] flex items-center justify-center text-white font-black text-lg">
                #{myRank.rank}
              </div>
              <div>
                <div className="font-bold text-foreground">Your Ranking</div>
                <div className="text-sm text-muted-foreground">{myRank.sessionCount} confirmed sessions</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl">{myRank.badge.emoji}</div>
              <div className="text-xs font-medium mt-1" style={{ color: myRank.badge.color }}>{myRank.badge.label}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as "monthly" | "allTime")}>
          <TabsList className="mb-8">
            <TabsTrigger value="monthly" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {monthName} Rankings
            </TabsTrigger>
            <TabsTrigger value="allTime" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              All-Time
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-16">
                <Trophy className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">No rankings yet</h3>
                <p className="text-muted-foreground mb-6">Be the first to book a session and claim the top spot!</p>
                <Link href="/programs">
                  <Button className="bg-[#1a3a8f] hover:bg-[#0f1f5c] text-white">
                    Book a Session
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.map((player) => (
                  <div
                    key={player.userId}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${getRankBg(player.rank)} ${
                      user?.id === player.userId ? "ring-2 ring-[#1a3a8f]" : ""
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-12 flex items-center justify-center flex-shrink-0">
                      {getRankIcon(player.rank)}
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1a3a8f] to-[#3b5fd4] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {player.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name + badge */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-foreground">{player.name}</span>
                        {user?.id === player.userId && (
                          <span className="text-xs bg-[#1a3a8f] text-white px-2 py-0.5 rounded-full">You</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-base">{player.badge.emoji}</span>
                        <span className="text-xs font-medium" style={{ color: player.badge.color }}>
                          {player.badge.label}
                        </span>
                      </div>
                    </div>

                    {/* Session count */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-xl font-black text-foreground">{player.sessionCount}</div>
                      <div className="text-xs text-muted-foreground">sessions</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Badge legend */}
        <div className="mt-12 bg-muted/50 rounded-2xl p-6">
          <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-[#1a3a8f]" />
            Badge Tiers
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { emoji: "🎯", label: "Beginner", sessions: "1–4 sessions", color: "#6b7280" },
              { emoji: "🌟", label: "Rising Star", sessions: "5–9 sessions", color: "#3b82f6" },
              { emoji: "🎾", label: "Tournament Player", sessions: "10–24 sessions", color: "#10b981" },
              { emoji: "⭐", label: "Pro Circuit", sessions: "25–49 sessions", color: "#6366f1" },
              { emoji: "🏆", label: "Grand Slam Champion", sessions: "50+ sessions", color: "#f59e0b" },
            ].map((tier) => (
              <div key={tier.label} className="flex items-center gap-3 bg-background rounded-xl p-3">
                <span className="text-xl">{tier.emoji}</span>
                <div>
                  <div className="text-sm font-medium" style={{ color: tier.color }}>{tier.label}</div>
                  <div className="text-xs text-muted-foreground">{tier.sessions}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">Ready to climb the leaderboard?</p>
          <Link href="/programs">
            <Button size="lg" className="bg-[#1a3a8f] hover:bg-[#0f1f5c] text-white font-bold px-8">
              Book a Session Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
