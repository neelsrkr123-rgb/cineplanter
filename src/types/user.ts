export interface Upload {
  id: string;
  title: string;
  thumbnail: string;
}

export interface Movie {
  id: string;
  title: string;
  poster: string;
  role?: string;
}

export interface Asset {
  id: string;
  name: string;
  preview: string;
}

export interface Academy {
  id: string;
  title: string;
  thumbnail: string;
}

export interface Post {
  id: string;
  content: string;
}

export interface Socials {
  instagram?: string;
  twitter?: string;
  youtube?: string;
}

export interface ExtendedUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isFilmmaker: boolean;
  bio?: string;
  tagline?: string;
  socials?: Socials;
  uploads?: Upload[];
  movies?: Movie[];
  assets?: Asset[];
  academy?: Academy[];
  posts?: Post[];
}
