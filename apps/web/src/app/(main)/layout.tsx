import { getAllCinemas } from '../../libs/actions/cinemas/cinema-action';
import { Footer } from './_components/footer';
import { Navbar } from './_components/navbar';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let cinemaOptions: { id: string; name: string }[] = [];

  try {
    const cinemas = await getAllCinemas();
    if (cinemas?.data) {
      cinemaOptions = cinemas.data.map((c) => ({
        id: c.id,
        name: c.name,
      }));
    }
  } catch (error) {
    // Log error but don't crash SSR - render with empty cinemas
    console.error('[MainLayout] Failed to fetch cinemas:', error);
  }
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden selection:bg-primary selection:text-white">
      <Navbar cinemas={cinemaOptions} />
      {/* Cinematic Background Gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-purple-900/20 via-background to-background pointer-events-none z-0" />

      {/* Content */}
      <main className="relative w-full flex-1 max-w-[1920px] mx-auto pt-36 md:pt-40 px-4 sm:px-8 md:px-12 lg:px-24 xl:px-32 z-10">
        {children}
      </main>

      <Footer />
    </div>
  );
}
