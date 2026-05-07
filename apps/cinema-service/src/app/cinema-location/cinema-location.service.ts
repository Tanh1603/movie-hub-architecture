import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CinemaLocationMapper } from './cinema-location.mapper';
import {
  GetCinemasNearbyDto,
  GetCinemasWithFiltersDto,
  GetCinemaDetailDto,
  CinemaListResponse,
  CinemaLocationResponse,
} from '@movie-hub/shared-types';
import { DistanceCalculator } from '../../utils/distance-calculator.util';
import { DecimalUtil } from '../../utils/decimal.util';
import { Prisma, HallType } from '../../../generated/prisma/client';
import Decimal from 'decimal.js';
import { ServiceResult } from '@movie-hub/shared-types/common';


@Injectable()
export class CinemaLocationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mapper: CinemaLocationMapper
  ) {}

  /**
   * Get cinemas nearby user location
   */
  async getCinemasNearby(
    dto: GetCinemasNearbyDto
  ): Promise<ServiceResult<CinemaListResponse>> {
    const { latitude, longitude, radiusKm = 10, limit = 20 } = dto;

    if (latitude === undefined || longitude === undefined || latitude === null || longitude === null) {
      throw new BadRequestException('Latitude and longitude are required');
    }

    // Calculate bounding box for efficient querying
    const { minLat, maxLat, minLon, maxLon } = DistanceCalculator.getBoundingBox(
      latitude,
      longitude,
      radiusKm
    );

    const minLatDecimal = DecimalUtil.toDecimal(minLat);
    const maxLatDecimal = DecimalUtil.toDecimal(maxLat);
    const minLonDecimal = DecimalUtil.toDecimal(minLon);
    const maxLonDecimal = DecimalUtil.toDecimal(maxLon);

    // Query cinemas within bounding box
    const cinemas = await this.prisma.cinemas.findMany({
      where: {
        status: 'ACTIVE',
        latitude: { gte: minLatDecimal, lte: maxLatDecimal },
        longitude: { gte: minLonDecimal, lte: maxLonDecimal },
      },
      include: { halls: true },
    });

    // Filter by exact distance and sort
    const nearbyCinemas = cinemas
      .filter((cinema) => {
        if (!cinema.latitude || !cinema.longitude) return false;
        return DistanceCalculator.isWithinRadius(
          latitude,
          longitude,
          cinema.latitude,
          cinema.longitude,
          radiusKm
        );
      })
      .map((cinema) => ({
        ...cinema,
        calculatedDistance: DistanceCalculator.calculateDistance(
          latitude,
          longitude,
          cinema.latitude as Prisma.Decimal,
          cinema.longitude as Prisma.Decimal
        ),
      }))
      .sort((a, b) => a.calculatedDistance - b.calculatedDistance)
      .slice(0, limit);

    const mapped = this.mapper.toCinemaLocationList(
      nearbyCinemas,
      latitude,
      longitude
    );

    return {
      data: {
        cinemas: mapped,
        total: mapped.length,
        page: 1,
        limit,
        hasMore: false,
      },
      message: 'Get nearby cinemas successfully!',
    };
  }

  /**
   * Get cinemas with advanced filters
   */
  async getCinemasWithFilters(
    filter: GetCinemasWithFiltersDto
  ): Promise<ServiceResult<CinemaListResponse>> {
    const {
      latitude,
      longitude,
      radiusKm,
      city,
      district,
      amenities,
      hallTypes,
      minRating,
      page = 1,
      limit = 20,
      sortBy = 'distance',
      sortOrder = 'asc',
    } = filter;

    // Build where clause
    const where: Prisma.CinemasWhereInput = {
      status: 'ACTIVE',
    };

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (district) {
      where.district = { contains: district, mode: 'insensitive' };
    }

    if (minRating) {
      where.rating = { gte: DecimalUtil.toDecimal(minRating) };
    }

    // Filter by amenities 
    if (amenities && amenities.length > 0) {
      where.amenities = {
        hasEvery: amenities, // PostgreSQL array contains all
      };
    }

    if (hallTypes && hallTypes.length > 0) {
      where.halls = {
        some: {
          type: { in: hallTypes as HallType[] },
        },
      };
    }

    // Fetch cinemas
    const cinemas = await this.prisma.cinemas.findMany({
      where,
      include: { halls: true },
    });

    // Filter by distance if location provided
    let filteredCinemas = cinemas;
    if (latitude && longitude && radiusKm) {
      filteredCinemas = cinemas.filter((cinema) => {
        if (!cinema.latitude || !cinema.longitude) return false;
        return DistanceCalculator.isWithinRadius(
          latitude,
          longitude,
          cinema.latitude,
          cinema.longitude,
          radiusKm
        );
      });
    }

    // Map to response
    let mapped = this.mapper.toCinemaLocationList(
      filteredCinemas,
      latitude,
      longitude
    );

    // Sort
    if (sortBy === 'distance' && latitude && longitude) {
      mapped = mapped.sort((a, b) => {
        const distA = a.location.distance || Infinity;
        const distB = b.location.distance || Infinity;
        return sortOrder === 'asc' ? distA - distB : distB - distA;
      });
    } else if (sortBy === 'rating') {
      mapped = mapped.sort((a, b) => {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return sortOrder === 'asc' ? ratingA - ratingB : ratingB - ratingA;
      });
    } else if (sortBy === 'name') {
      mapped = mapped.sort((a, b) =>
        sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      );
    }

    // Pagination
    const skip = (page - 1) * limit;
    const paginatedCinemas = mapped.slice(skip, skip + limit);

    return {
      data: {
        cinemas: paginatedCinemas,
        total: mapped.length,
        page,
        limit,
        hasMore: skip + limit < mapped.length,
      },
      message: 'Get cinemas with filters successfully!',
    };
  }

  /**
   * Get cinema detail by ID
   */
  async getCinemaDetail(
    dto: GetCinemaDetailDto
  ): Promise<ServiceResult<CinemaLocationResponse>> {
    const { cinemaId, userLatitude, userLongitude } = dto;

    const cinema = await this.prisma.cinemas.findUnique({
      where: { id: cinemaId },
      include: { halls: true },
    });

    if (!cinema) {
      throw new NotFoundException(`Cinema with ID ${cinemaId} not found`);
    }

    return {
      data: this.mapper.toCinemaLocationResponse(
        cinema,
        userLatitude,
        userLongitude
      ),
      message: 'Get cinema detail successfully!',
    };
  }

  /**
   * Search cinemas by name or address
   */
  async searchCinemas(
    query: string,
    userLatitude?: number,
    userLongitude?: number
  ): Promise<ServiceResult<CinemaLocationResponse[]>> {
    const cinemas = await this.prisma.cinemas.findMany({
      where: {
        status: 'ACTIVE',
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { address: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: { halls: true },
      take: 20,
    });

    return {
      data: this.mapper.toCinemaLocationList(
        cinemas,
        userLatitude,
        userLongitude
      ),
      message: 'Search cinemas successfully!',
    };
  }

  /**
   * Get available cities
   */
  async getAvailableCities(): Promise<ServiceResult<string[]>> {
    const cinemas = await this.prisma.cinemas.findMany({
      where: { status: 'ACTIVE' },
      select: { city: true },
      distinct: ['city'],
      orderBy: { city: 'asc' },
    });

    return {
      data: cinemas.map((c) => c.city),
      message: 'Get available cities successfully!',
    };
  }

  /**
   * Get available districts by city
   */
  async getAvailableDistricts(city: string): Promise<ServiceResult<string[]>> {
    const cinemas = await this.prisma.cinemas.findMany({
      where: {
        city: { contains: city, mode: 'insensitive' },
        status: 'ACTIVE',
        district: { not: null },
      },
      select: { district: true },
      distinct: ['district'],
      orderBy: { district: 'asc' },
    });

    return {
      data: cinemas
        .map((c) => c.district)
        .filter((d): d is string => d !== null),
      message: 'Get available districts successfully!',
    };
  }
}
