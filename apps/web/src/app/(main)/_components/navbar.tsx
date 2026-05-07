'use client';
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/nextjs';
import { Logo } from '@/components/logo';
import { Button } from '@movie-hub/shacdn-ui/button';
import { MenuIcon, TicketPlus, XIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MagicSearch } from './magic-search';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@movie-hub/shacdn-ui/select';
import { Skeleton } from '@movie-hub/shacdn-ui/skeleton';

export interface CinemaSelector {
  id: string;
  name: string;
}
interface NavbarProps {
  cinemas: CinemaSelector[];
}
export const Navbar = ({ cinemas }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const router = useRouter();

  const [cinemaSelected, setCinemaSelected] = useState<string | undefined>();

  const handleSelectCinema = (cinemaId: string) => {
    setCinemaSelected(cinemaId);
    router.push(`/cinemas/${cinemaId}`);
  };

  const navLinks = [
    { href: '/showtimes', label: 'Lịch chiếu' },
    { href: '/promotions', label: 'Khuyến mãi' },
    { href: '/rent', label: 'Tổ chức sự kiện' },
    { href: '/services', label: 'Dịch vụ giải trí khác' },
    { href: '/about', label: 'Giới thiệu' },
  ];

  return (
    <nav className="fixed top-0 left-0 w-screen z-50 bg-[#0f1014]/95 backdrop-blur-md border-b border-white/5 transition-all duration-300">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-8 md:px-12 lg:px-24 xl:px-32 flex flex-col">
        {/* Top Row: Logo, Search, Auth */}
        <div className="flex items-center justify-between h-20 gap-x-4 md:gap-x-8">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Logo />
          </div>

          {/* Search Bar - Visual Only (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-auto px-4">
            <MagicSearch />
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-4">
            <ClerkLoading>
              <Skeleton className="h-9 w-9 rounded-full bg-white/10" />
            </ClerkLoading>

            <ClerkLoaded>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button className="px-6 py-2 bg-gradient-to-r from-[#663399] to-[#3366cc] hover:from-[#5a2d8a] hover:to-[#2b56ad] text-white rounded-full font-bold text-xs tracking-wide shadow-[0_0_15px_rgba(102,51,153,0.4)] hover:shadow-[0_0_25px_rgba(102,51,153,0.6)] transition-all duration-300 border-none">
                    LOGIN
                  </Button>
                </SignInButton>
              </SignedOut>

              <SignedIn>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: 'w-9 h-9 border-2 border-primary/20',
                    },
                  }}
                >
                  <UserButton.MenuItems>
                    <UserButton.Action
                      label="Vé của tôi"
                      labelIcon={<TicketPlus size={15} />}
                      onClick={() => {
                        router.push('/my-booking');
                      }}
                    />
                  </UserButton.MenuItems>
                </UserButton>
              </SignedIn>
            </ClerkLoaded>

            <MenuIcon
              className="md:hidden w-8 h-8 text-white cursor-pointer hover:text-primary transition-colors"
              onClick={() => setIsOpen(true)}
            />
          </div>
        </div>

        {/* Bottom Row: Navigation Links (Desktop) */}
        <div className="hidden md:flex items-center gap-8 pb-4 border-t border-white/5 pt-2">
          {/* Cinema Selector */}
          <Select value={cinemaSelected} onValueChange={handleSelectCinema}>
            <SelectTrigger className="w-[180px] text-white/90 bg-white/5 border border-white/10 rounded-full px-4 py-2 hover:bg-white/10 transition-colors focus:ring-0 focus:ring-offset-0 ring-offset-0 focus:ring-transparent">
              <SelectValue placeholder="Chọn rạp" />
            </SelectTrigger>
            <SelectContent
              className="bg-neutral-900 text-white border-neutral-800 rounded-lg max-h-64 overflow-y-auto"
              position="popper"
            >
              {cinemas.map((cinema) => (
                <SelectItem
                  key={cinema.id}
                  value={cinema.id}
                  className="cursor-pointer focus:bg-primary focus:text-white"
                >
                  {cinema.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Navigation Links */}
          <div className="flex items-center gap-8">
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group relative py-1"
              >
                <span className="relative z-10 font-bold text-sm text-gray-300 group-hover:text-white transition-colors duration-300 uppercase tracking-widest">
                  {item.label}
                </span>
                {/* Underline effect */}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300 ease-out" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center gap-8 transition-all duration-300 md:hidden ${
          isOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <XIcon
          className="absolute top-6 right-6 w-8 h-8 text-white cursor-pointer hover:text-primary transition-colors"
          onClick={() => setIsOpen(false)}
        />
        {navLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => {
              setIsOpen(false);
            }}
            className="text-2xl font-black uppercase tracking-widest text-white hover:text-primary transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
};
