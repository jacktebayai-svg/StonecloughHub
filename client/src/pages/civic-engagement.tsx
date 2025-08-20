import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import CivicEngagementTools from "@/components/civic/engagement-tools";

export default function CivicEngagement() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      <div className="py-8">
        <CivicEngagementTools />
      </div>
      <Footer />
    </div>
  );
}
