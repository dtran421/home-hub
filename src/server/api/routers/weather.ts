import axios from "axios";
import { ApiResponse } from "utils-toolkit";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import {
  type WeatherForecast,
  type WeatherForecastJSON,
} from "@/types/Weather";

const BASE_URL = "https://api.weatherapi.com/v1";

const processResponse = (data: WeatherForecastJSON): WeatherForecast => ({
  location: {
    name: data.location.name,
    region: data.location.region,
    tzId: data.location.tz_id,
    localTime: data.location.localtime,
  },
  forecasts: data.forecast.forecastday.map((day) => ({
    date: day.date,
    condition: day.day.condition,
    maxTempF: day.day.maxtemp_f,
    minTempF: day.day.mintemp_f,
    avgTempF: day.day.avgtemp_f,
    maxWindMph: day.day.maxwind_mph,
    totalPrecipIn: day.day.totalprecip_in,
    totalSnowCm: day.day.totalsnow_cm,
    avgVisMiles: day.day.avgvis_miles,
    avgHumidity: day.day.avghumidity,
    dailyWillItRain: !!day.day.daily_will_it_rain,
    dailyChanceOfRain: day.day.daily_chance_of_rain,
    dailyWillItSnow: !!day.day.daily_will_it_snow,
    dailyChanceOfSnow: day.day.daily_chance_of_snow,
    uv: day.day.uv,

    astro: {
      sunrise: day.astro.sunrise,
      sunset: day.astro.sunset,
      moonPhase: day.astro.moon_phase,
      isMoonUp: !!day.astro.is_moon_up,
      isSunUp: !!day.astro.is_sun_up,
    },

    hourly: day.hour.map((hour) => ({
      time: hour.time,
      condition: hour.condition,
      humidity: hour.humidity,
      cloud: hour.cloud,
      timeEpoch: hour.time_epoch,
      tempF: hour.temp_f,
      windMph: hour.wind_mph,
      windDegree: hour.wind_degree,
      windDir: hour.wind_dir,
      precipIn: hour.precip_in,
      feelsLikeF: hour.feelslike_f,
      windChillF: hour.windchill_f,
      heatIndexF: hour.heatindex_f,
      willItRain: !!hour.will_it_rain,
      chanceOfRain: hour.chance_of_rain,
      willItSnow: !!hour.will_it_snow,
      chanceOfSnow: hour.chance_of_snow,
      visMiles: hour.vis_miles,
      gustMph: hour.gust_mph,
      uv: hour.uv,
    })),
  })),
});

export const weatherRouter = createTRPCRouter({
  get3DayForecast: protectedProcedure
    .input(z.object({ city: z.string() }))
    .query(async ({ input }) => {
      const endpoint = "/forecast.json";
      const queryString = new URLSearchParams({
        key: process.env.WEATHER_ACCESS_KEY ?? "",
        q: input.city,
        days: "3",
      });

      try {
        const { data } = await axios.get<WeatherForecastJSON>(
          `${BASE_URL}${endpoint}?${queryString.toString()}`,
        );

        return ApiResponse<WeatherForecast>(processResponse(data));
      } catch (error) {
        if (!(error instanceof Error)) {
          return ApiResponse<WeatherForecast>(new Error("500 Internal Error"));
        }

        if (axios.isAxiosError(error)) {
          console.error("Something went wrong with axios: ", error.toJSON());
        } else {
          console.error("Something went wrong: ", error.message);
        }
        return ApiResponse<WeatherForecast>(error);
      }
    }),
});
