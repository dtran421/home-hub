import { z } from "zod";
import axios from "axios";

import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { type WeatherForecastJSON } from "@/types/Weather";

const BASE_URL = "https://api.weatherapi.com/v1";

export const weatherRouter = createTRPCRouter({
  get3DayForecast: publicProcedure
    .input(z.object({ city: z.string() }))
    .query(async ({ input }) => {
      const endpoint = "/forecast.json";
      const queryString = new URLSearchParams({
        key: process.env.WEATHER_ACCESS_KEY ?? "",
        q: input.city,
        days: "3",
      });

      const { data } = await axios.get<WeatherForecastJSON>(
        `${BASE_URL}${endpoint}?${queryString.toString()}`,
      );

      return data;
    }),
});
