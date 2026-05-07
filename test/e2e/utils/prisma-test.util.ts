import { PrismaClient as BookingClient } from '@prisma/client/booking-service';
import { PrismaClient as CinemaClient } from '@prisma/client/cinema-service';
import { PrismaClient as MovieClient } from '@prisma/client/movie-service';
import { PrismaClient as UserClient } from '@prisma/client/user-service';
import { BookingStatus } from '@movie-hub/shared-types/booking/enum';

export class PrismaTestUtil {
  public booking: BookingClient;
  public cinema: CinemaClient;
  public movie: MovieClient;
  public user: UserClient;

  constructor() {
    // Assuming environment variables are set correctly for these to connect
    // In a real CI, these would point to test DBs.
    this.booking = new BookingClient({ datasources: { db: { url: process.env.DATABASE_URL_BOOKING } } });
    this.cinema = new CinemaClient({ datasources: { db: { url: process.env.DATABASE_URL_CINEMA } } });
    this.movie = new MovieClient({ datasources: { db: { url: process.env.DATABASE_URL_MOVIE } } });
    this.user = new UserClient({ datasources: { db: { url: process.env.DATABASE_URL_USER } } });
  }

  async connect() {
    await Promise.all([
      this.booking.$connect(),
      this.cinema.$connect(),
      this.movie.$connect(),
      this.user.$connect(),
    ]);
  }

  async disconnect() {
    await Promise.all([
      this.booking.$disconnect(),
      this.cinema.$disconnect(),
      this.movie.$disconnect(),
      this.user.$disconnect(),
    ]);
  }

  // --- Helpers to fetch existing data for tests ---

  async getFirstCinema() {
    return this.cinema.cinemas.findFirst({ include: { halls: { include: { seats: true } } } });
  }
  
  async getCinemaWithHallAndSeats() {
      // Find a cinema that has at least one hall which has seats
      const cinema = await this.cinema.cinemas.findFirst({
          where: {
              halls: {
                  some: {
                      seats: { some: {} }
                  }
              }
          },
          include: {
              halls: {
                  include: {
                      seats: true
                  }
              }
          }
      });
      return cinema;
  }

  async getFirstMovie() {
    return this.movie.movie.findFirst({ include: { movieReleases: true } });
  }
  
  async getMovieWithRelease() {
      return this.movie.movie.findFirst({
          where: {
              movieReleases: { some: {} }
          },
          include: { movieReleases: true }
      });
  }

  async getAdminUser() {
    // This assumes an admin user exists or we might need to create one if allowed
    // For now, return a random user and we might mock the permission check
    return this.user.staff.findFirst({ where: { position: 'CINEMA_MANAGER' } }); // Approx Admin
  }
  
  async getMemberUser() {
      // Just a user, not staff? The user service schema has 'Staff' table but 'User' logic might be in Clerk?
      // Wait, the SRS says "User Service Entities: Role, Permission, Staff".
      // Regular "Members" (customers) are stored in Clerk mostly, but likely have a record or are just referenced by ID.
      // We can generate a random UUID for a "Member" since the system likely trusts the ID from AuthGuard.
      return 'user_test_' + Math.floor(Math.random() * 10000); 
  }

  async createShowtime(cinemaId: string, hallId: string, movieId: string, movieReleaseId: string, startTime: Date) {
    return this.cinema.showtimes.create({
      data: {
        cinema_id: cinemaId,
        hall_id: hallId,
        movie_id: movieId,
        movie_release_id: movieReleaseId,
        start_time: startTime,
        end_time: new Date(startTime.getTime() + 2 * 60 * 60 * 1000), // +2h
        format: 'TWO_D',
        language: 'Vietnamese',
        available_seats: 100,
        total_seats: 100,
        status: 'SCHEDULED'
      }
    });
  }

  async clearShowtimes(showtimeId: string) {
      if(!showtimeId) return;
      await this.cinema.seatReservations.deleteMany({ where: { showtime_id: showtimeId }});
      await this.cinema.showtimes.delete({ where: { id: showtimeId } });
  }
  
  async clearBookingsForShowtime(showtimeId: string) {
      // Clean up bookings related to this showtime to avoid clutter
      await this.booking.bookings.deleteMany({ where: { showtime_id: showtimeId } });
  }
}
