export interface ReviewResponse {
  id: string;
  movieId: string;
  userId: string;
  rating: number;
  content: string;
  createdAt: Date;
  movie?: {
    id: string;
    title: string;
  };
  user?: {
    id: string;
    fullName: string | null;
    imageUrl: string;
  };
}
