import Timeline from '@/src/components/Timeline';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { fetchCalendarEvents } from '@/src/lib/google';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    // Redirect to login if not authenticated
    return <div>Redirecting...</div>;
  }
  const events = await fetchCalendarEvents(session);
  return <Timeline events={events} />;
}
