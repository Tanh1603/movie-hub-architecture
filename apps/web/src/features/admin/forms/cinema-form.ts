import type { Cinema, CreateCinemaRequest, UpdateCinemaRequest } from '@/libs/api/types';

export type CinemaFormValues = Partial<CreateCinemaRequest>;

export const createDefaultCinemaForm = (): CinemaFormValues => ({
  name: '',
  address: '',
  city: '',
  district: '',
  phone: '',
  email: '',
  website: '',
  description: '',
  amenities: [],
  facilities: {},
  images: [],
  virtualTour360Url: '',
  operatingHours: { open: '', close: '' },
  socialMedia: { facebook: '', instagram: '', twitter: '' },
  timezone: 'Asia/Ho_Chi_Minh',
});

export const mapCinemaToForm = (cinema: Cinema): CinemaFormValues => ({
  ...cinema,
  amenities: cinema.amenities ?? [],
  facilities: cinema.facilities ?? {},
  images: cinema.images ?? [],
  operatingHours: cinema.operatingHours ?? {},
  socialMedia: cinema.socialMedia ?? {},
});

export const toCreateCinemaRequest = (
  values: CinemaFormValues
): CreateCinemaRequest => ({
  name: values.name ?? '',
  address: values.address ?? '',
  city: values.city ?? '',
  district: values.district ?? '',
  phone: values.phone,
  email: values.email,
  website: values.website,
  latitude: values.latitude,
  longitude: values.longitude,
  description: values.description,
  amenities: values.amenities ?? [],
  facilities: values.facilities ?? {},
  images: values.images ?? [],
  virtualTour360Url: values.virtualTour360Url,
  operatingHours: values.operatingHours ?? {},
  socialMedia: values.socialMedia ?? {},
  timezone: values.timezone ?? 'Asia/Ho_Chi_Minh',
});

export const toUpdateCinemaRequest = (
  values: CinemaFormValues
): UpdateCinemaRequest => toCreateCinemaRequest(values);

