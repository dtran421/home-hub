import { api } from "@/utils/api";

export const use3DayForecast = (city: string | null | undefined) => {
  const { data: forecast, isFetching } = api.weather.get3DayForecast.useQuery(
    { city: city ?? "" },
    {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 30, // 30 minutes
      enabled: !!city,
    },
  );

  return {
    forecast,
    isFetching,
  };
};
