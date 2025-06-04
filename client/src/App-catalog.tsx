import { Router, Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CatalogNavbar from "@/components/CatalogNavbar";
import Footer from "@/components/Footer";
import CatalogHome from "@/pages/catalog-home";
import Browse from "@/pages/browse";
import Compare from "@/pages/compare";
import About from "@/pages/about";
import Research from "@/pages/research";
import ResearchDetail from "@/pages/research-detail";
import Detail from "@/pages/detail";
import AdminPage from "@/pages/admin-page";
import NotFound from "@/pages/not-found";

// Create query client with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

export default function CatalogApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen flex flex-col">
          <CatalogNavbar />
          <main className="flex-1">
            <Switch>
              <Route path="/" component={CatalogHome} />
              <Route path="/browse" component={Browse} />
              <Route path="/compare" component={Compare} />
              <Route path="/about" component={About} />
              <Route path="/research" component={Research} />
              <Route path="/research/:id" component={ResearchDetail} />
              <Route path="/show/:id" component={Detail} />
              <Route path="/admin" component={AdminPage} />
              <Route component={NotFound} />
            </Switch>
          </main>
          <Footer />
        </div>
      </Router>
    </QueryClientProvider>
  );
}