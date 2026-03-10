import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Redirect, useSearch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Programs from "./pages/Programs";
import BookingPage from "./pages/BookingPage";
import SocialFeed from "./pages/SocialFeed";
import MentalCoaching from "./pages/MentalCoaching";
import Services from "./pages/Services";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import Gallery from "./pages/Gallery";
import AdminSchedule from "./pages/AdminSchedule";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ChatBot from "./components/ChatBot";
import { InstallPrompt } from "./components/InstallPrompt";
import FloatingContact from "./components/FloatingContact";
import QuickBook from "./components/QuickBook";
import MobileBottomBar from "./components/MobileBottomBar";
import Schedule from "./pages/Schedule";
import WelcomeModal from "./components/WelcomeModal";
import Leaderboard from "./pages/Leaderboard";
import GiftCard from "./pages/GiftCard";
import AdminNewsletter from "./pages/AdminNewsletter";
import VoiceBooking from "./components/VoiceBooking";

// Captures ?ref=CODE from URL and stores in localStorage before login
function ReferralCapture() {
  const search = useSearch();
  useEffect(() => {
    const params = new URLSearchParams(search);
    const ref = params.get("ref");
    if (ref && ref.length > 3) {
      localStorage.setItem("referralCode", ref);
    }
  }, [search]);
  return null;
}

function Router() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pb-16 md:pb-0">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/programs" component={Programs} />
          <Route path="/book/:programType?" component={BookingPage} />
          <Route path="/social" component={SocialFeed} />
          <Route path="/mental-coaching" component={MentalCoaching} />
          <Route path="/services" component={Services} />
          <Route path="/profile" component={Profile} />
          <Route path="/gallery" component={Gallery} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin/schedule" component={AdminSchedule} />
          <Route path="/schedule" component={Schedule} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/gift-card" component={GiftCard} />
          <Route path="/gift-card/success" component={GiftCard} />
          <Route path="/admin/newsletter" component={AdminNewsletter} />
          <Route path="/dashboard">{() => <Redirect to="/admin" />}</Route>
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
      <ChatBot />
      <FloatingContact />
      <QuickBook />
      <InstallPrompt />
      <MobileBottomBar />
      <WelcomeModal />
      <VoiceBooking />
      <ReferralCapture />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
