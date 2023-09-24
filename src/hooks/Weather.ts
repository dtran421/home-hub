import { ApiResponse, consumeApiResponse, Option } from "utils-toolkit";

import { type WeatherForecast } from "@/types/Weather";
import { api } from "@/utils/api";
import { getError } from "@/utils/query";

export const use3DayForecast = (city: string | null | undefined) => {
  const {
    data: forecast,
    isLoading,
    isError,
    error: queryError,
  } = api.weather.get3DayForecast.useQuery(
    { city: city ?? "" },
    {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 30, // 30 minutes
      enabled: !!city,
    },
  );

  const apiResponse = Option(forecast).coalesce(
    ApiResponse<WeatherForecast>(null),
  );
  const maybeForecast = consumeApiResponse(apiResponse);
  const isErr = !maybeForecast.ok;

  const error = getError({
    isServerError: isErr,
    isUncaughtError: isError,
    responseError: isErr ? maybeForecast.unwrap() : null,
    uncaughtError: queryError,
  });

  return {
    forecast: !isErr ? maybeForecast.unwrap() : null,
    isLoading,
    isError: isErr || isError,
    error,
  };
};
