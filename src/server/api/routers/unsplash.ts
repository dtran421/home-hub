import axios from "axios";
import { ApiResponse } from "utils-toolkit";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  type UnsplashRandomImage,
  type UnsplashRandomImageJSON,
} from "@/types/Unsplash";

const BASE_URL = "https://api.unsplash.com";

const processResponse = (
  data: UnsplashRandomImageJSON,
): UnsplashRandomImage => ({
  width: data.width,
  height: data.height,
  description: data.description,
  location: data.location,
  exif: {
    model: data.exif.model,
  },
  urls: data.urls,
  links: {
    self: data.links.self,
  },
  user: {
    name: data.user.name,
    username: data.user.username,
  },
});

export const unsplashRouter = createTRPCRouter({
  getRandomImage: publicProcedure
    .input(
      z.object({
        topics: z.string().optional(),
        orientation: z.string().optional(),
        collections: z.string().optional(),
        query: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { topics, orientation, collections, query } = input;

      const endpoint = "/photos/random";
      const queryString = new URLSearchParams();

      if (topics) {
        queryString.set("topics", topics);
      }

      if (orientation) {
        queryString.set("orientation", orientation);
      }

      if (collections) {
        queryString.set("collections", collections);
      }

      if (query) {
        queryString.set("query", query);
      }

      try {
        const { data } = await axios.get<UnsplashRandomImageJSON>(
          `${BASE_URL}${endpoint}?${queryString.toString()}`,
          {
            headers: {
              Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
              "Accept-Version": "v1",
            },
          },
        );

        return ApiResponse<UnsplashRandomImage>(processResponse(data));
      } catch (error) {
        if (!(error instanceof Error)) {
          return ApiResponse<UnsplashRandomImage>(
            new Error("500 Internal Error"),
          );
        }

        if (axios.isAxiosError(error)) {
          console.error("Something went wrong with axios: ", error.toJSON());
        } else {
          console.error("Something went wrong: ", error.message);
        }
        return ApiResponse<UnsplashRandomImage>(error);
      }
    }),
});
