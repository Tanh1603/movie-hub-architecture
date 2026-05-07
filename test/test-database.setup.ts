import { PrismaClient } from '@prisma/client';

export class TestDatabaseSetup {
  private prismaService: PrismaClient;

  constructor() {
    this.prismaService = new PrismaClient();
  }

  async setupTestData() {
    // Create test movies
    try {
      await this.prismaService.movie.createMany({
        data: [
          {
            title: 'Test Movie 1',
            genre: 'Action',
            duration: 120,
            releaseDate: new Date(),
            description: 'Test movie for integration tests',
            posterUrl: 'https://example.com/poster1.jpg',
          },
          {
            title: 'Test Movie 2',
            genre: 'Comedy',
            duration: 90,
            releaseDate: new Date(),
            description: 'Another test movie for integration tests',
            posterUrl: 'https://example.com/poster2.jpg',
          },
        ],
      });
    } catch (error) {
      console.warn(
        'Test data setup failed:',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  async cleanup() {
    try {
      await this.prismaService.movie.deleteMany();
      await this.prismaService.user.deleteMany();
      await this.prismaService.cinema.deleteMany();
    } catch (error) {
      console.warn(
        'Test cleanup failed:',
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      await this.prismaService.$disconnect();
    }
  }
}
