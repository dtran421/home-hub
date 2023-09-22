interface Exif {
  make: string;
  model: string;
  exposure_time: string;
  aperture: string;
  focal_length: string;
  iso: number;
}

interface Links {
  self: string;
  html: string;
  download: string;
  download_location: string;
}

interface Location {
  name: string;
  city: string;
  country: string;
  position: {
    latitude: number;
    longitude: number;
  };
}

interface Urls {
  raw: string;
  full: string;
  regular: string;
  small: string;
  thumb: string;
}

interface User {
  id: string;
  updated_at: Date;
  username: string;
  name: string;
  portfolio_url: string;
  bio: string;
  location: string;
  total_likes: number;
  total_photos: number;
  total_collections: number;
  instagram_username: string;
  twitter_username: string;
  links: {
    self: string;
    html: string;
    photos: string;
    likes: string;
    portfolio: string;
  };
}

export interface UnsplashRandomImageJSON {
  id: string;
  created_at: Date;
  updated_at: Date;
  width: number;
  height: number;
  color: string;
  blur_hash: string;
  downloads: number;
  likes: number;
  liked_by_user: boolean;
  description: string;
  exif: Exif;
  location: Location;
  current_user_collections: {
    id: number;
    title: string;
    published_at: Date;
    last_collected_at: Date;
    updated_at: Date;
    cover_photo: null;
    user: null;
  }[];
  urls: Urls;
  links: Links;
  user: User;
}

export interface UnsplashRandomImage {
  width: number;
  height: number;
  description: string;
  location: Location;
  exif: Pick<Exif, "model">;
  urls: Urls;
  links: Pick<Links, "self">;
  user: Pick<User, "name" | "username">;
}
