import { Card, CardContent } from '@movie-hub/shacdn-ui/card';
import { CinemaLocationResponse } from '@/libs/types/cinema.type';
import { MapPin, Phone, Mail, Globe, Star, Clock } from 'lucide-react';
import Image from 'next/image';

export default function CinemaDetailCard({
  cinema,
}: {
  cinema: CinemaLocationResponse;
}) {
  return (
    <Card className="w-full rounded-xl shadow-md bg-cyan-500/15 border border-cyan-500/50 text-gray-200 p-4">
      <CardContent className="flex flex-col md:flex-row gap-4">
        {/* Left image */}
        <div className="w-full md:w-1/3 h-40 md:h-auto rounded-lg bg-neutral-500 overflow-hidden flex-shrink-0">
          <Image
            src={cinema.images?.[0] || '/placeholder.jpg'}
            alt={cinema.name}
            width={400}
            height={300}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right info */}
        <div className="flex-1 flex flex-col gap-2">
          {/* Title and rating */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
            <h2 className="text-xl font-bold text-cyan-300">{cinema.name}</h2>
            <div className="flex items-center gap-1 text-yellow-500 text-sm">
              <Star className="w-4 h-4" /> {cinema.rating || '—'}
              <span className="text-gray-400">({cinema.totalReviews})</span>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-center gap-1 text-gray-300 text-sm">
            <MapPin className="w-4 h-4" />
            <span>
              {cinema.address}, {cinema.district && `${cinema.district},`}{' '}
              {cinema.city}
            </span>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-1 text-gray-300 text-sm">
            {cinema.phone && (
              <div className="flex items-center gap-1">
                <Phone className="w-4 h-4" /> {cinema.phone}
              </div>
            )}
            {cinema.email && (
              <div className="flex items-center gap-1">
                <Mail className="w-4 h-4" /> {cinema.email}
              </div>
            )}
            {cinema.website && (
              <div className="flex items-center gap-1">
                <Globe className="w-4 h-4" />{' '}
                <a
                  href={cinema.website}
                  target="_blank"
                  className="underline text-cyan-400 hover:text-cyan-300"
                >
                  Website
                </a>
              </div>
            )}
          </div>

          {/* Operating hours */}
          {cinema.operatingHours && (
            <div className="bg-neutral-800/40 border border-neutral-700 rounded-xl p-4">
              <h3 className="text-cyan-300 font-semibold flex gap-2 items-center mb-2">
                <Clock className="w-4 h-4" /> Giờ hoạt động
              </h3>

              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-y-2 text-sm">
                {Object.entries(cinema.operatingHours).map(([day, hours]) => (
                  <li key={day} className="flex flex-col">
                    <span className="text-gray-400">{day}</span>
                    <span className="text-gray-200 font-medium">
                      {String(hours)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Amenities */}
          {cinema.amenities?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {cinema.amenities.map((a, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-sm font-medium shadow-md shadow-cyan-500/20"
                >
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
