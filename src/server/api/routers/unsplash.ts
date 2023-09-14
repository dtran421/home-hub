import axios from "axios";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { type UnsplashRandomImageJSON } from "@/types/Unsplash";

const BASE_URL = "https://api.unsplash.com";

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
        queryString.append("topics", topics);
      }

      if (orientation) {
        queryString.append("orientation", orientation);
      }

      if (collections) {
        queryString.append("collections", collections);
      }

      if (query) {
        queryString.append("query", query);
      }

      const { data } = await axios.get<UnsplashRandomImageJSON>(
        `${BASE_URL}${endpoint}?${queryString.toString()}`,
        {
          headers: {
            Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
            "Accept-Version": "v1",
          },
        },
      );

      return data;
    }),
});
