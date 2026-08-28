import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Home from "./pages/Home";
import About from "./pages/About";
import Sermons from "./pages/Sermons";
import Worship from "./pages/Worship";
import Meditation from "./pages/Meditation";
import Ministries from "./pages/Ministries";
import Connect from "./pages/Connect";
import MediaLibrary from "./pages/MediaLibrary";
import Events from "./pages/Events";
import AdminInbox from "@/pages/AdminInbox";
import AdminDailyBible from "@/pages/AdminDailyBible";
import { scrollPageToTop } from "@/lib/navigation";

function ScrollToTopOnNavigation() {
  const [location] = useLocation();

  useEffect(() => {
    scrollPageToTop();
  }, [location]);

  return null;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/sermons" component={Sermons} />
      <Route path="/worship" component={Worship} />
      <Route path="/meditation" component={Meditation} />
      <Route path="/ministries" component={Ministries} />
      <Route path="/connect" component={Connect} />
      <Route path="/media" component={MediaLibrary} />
      <Route path="/events" component={Events} />
      <Route path="/admin" component={AdminInbox} />
      <Route path="/admin/daily-bible" component={AdminDailyBible} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <ScrollToTopOnNavigation />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
