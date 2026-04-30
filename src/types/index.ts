export interface Movie {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  youtubeId: string;
  genre: string;
  rating: number;
  duration: string;
  price: number;
  isPremium: boolean;
  cast: string[];
  crew: string[];
  uploadDate: string;
  uploader: {
    id: string;
    name: string;
    avatar: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isFreelancer: boolean;
}