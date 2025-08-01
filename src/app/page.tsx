import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/app/api/auth/[...nextauth]/route';
import { LoginButton } from '@/src/components/LoginButton';
import ClientCalendarTimeline from './ClientCalendarTimeline';


// Server component
export default async function HomePage() {
  const session = await getServerSession(authOptions);
  return (
    <main>
      <section className="w-full max-w-2xl text-center py-16">
        {!session ? (
          <div className="flex justify-center">
            <LoginButton className="px-8 py-4 text-xl font-bold bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-full shadow-lg hover:scale-105 transition-transform duration-200" />
          </div>
        ) : (
          <ClientCalendarTimeline session={session} />
        )}
      </section>
    </main>
  );
}
