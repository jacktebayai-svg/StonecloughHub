import { Metadata } from 'next';
import CivicDashboard from '@/components/civic/CivicDashboard';

export const metadata: Metadata = {
  title: 'Civic Transparency Dashboard - Stoneclough Hub',
  description: 'Real-time transparency dashboard for Bolton Council operations, planning applications, spending, and meetings. Access comprehensive civic data and insights.',
  keywords: ['civic dashboard', 'Bolton Council', 'transparency', 'planning applications', 'council spending', 'meetings', 'local government'],
  openGraph: {
    title: 'Civic Transparency Dashboard - Stoneclough Hub',
    description: 'Track Bolton Council operations with real-time data on planning, spending, and meetings.',
    type: 'website',
  },
};

export default function CivicDashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <CivicDashboard />
    </main>
  );
}
