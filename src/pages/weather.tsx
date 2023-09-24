import { type FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import {
  FiArrowUp,
  FiMinus,
  FiSunrise,
  FiSunset,
  FiTrendingDown,
  FiTrendingUp,
} from "react-icons/fi";

import { ErrorAlert } from "@/components/Alerts/ErrorAlert";
import { WarningAlert } from "@/components/Alerts/WarningAlert";
import { NavMenu } from "@/components/NavMenu";
import { useGetUser, useUpdateUser } from "@/hooks/User";
import { use3DayForecast } from "@/hooks/Weather";
import {
  type ForecastDay,
  type ForecastLocation,
  type WeatherForecastJSON,
} from "@/types/Weather";

const Weather = () => {
  const { data: session, status: sessionStatus } = useSession();

  const {
    user,
    isFetching: isFetchingUser,
    isError,
    error,
  } = useGetUser(session);
  const updateUser = useUpdateUser();

  const { forecast, isFetching: isFetchingForecast } = use3DayForecast(
    user?.city,
  );

  const [newCity, setNewCity] = useState(user?.city ?? "");
  useEffect(() => {
    setNewCity(user?.city ?? "");
  }, [user?.city]);

  const [warning, setWarning] = useState("");

  const submitHandler = (e: FormEvent) => {
    e.preventDefault();

    if (!newCity) {
      setWarning("Please enter a city");
      return;
    }

    if (newCity === user?.city) {
      return;
    }

    updateUser.mutate({ city: newCity });
  };

  const loadingUser =
    sessionStatus === "loading" || isFetchingUser || updateUser.isLoading;

  return (
    <div className="flex h-screen w-full flex-col items-center bg-cover bg-center p-4">
      <form onSubmit={submitHandler}>
        <input
          type="text"
          placeholder="New York, NY"
          value={newCity}
          onChange={(e) => setNewCity(e.target.value)}
          className={`input input-bordered ${
            !user?.city ? "input-primary" : ""
          } input-md w-full max-w-xs text-center text-primary`}
        />
        {loadingUser || isFetchingUser ? (
          <div className="mt-6">
            <span className="loading loading-spinner loading-md text-accent" />
          </div>
        ) : null}
        {!loadingUser && !user?.city ? (
          <div className="mt-6 flex flex-col items-center gap-y-2">
            <FiArrowUp size={20} />
            <p className="text-neutral-content">Enter a city to get started</p>
          </div>
        ) : null}
      </form>
      {isFetchingForecast ? (
        <span className="loading loading-spinner loading-md text-accent" />
      ) : (
        <>
          <WeatherHeader location={forecast?.location} />
          <WeatherForecast forecast={forecast} />
        </>
      )}
      <NavMenu />
      {!isError && warning && (
        <WarningAlert message={warning} onClose={() => setWarning("")} />
      )}
      {isError && <ErrorAlert message={error?.message} />}
    </div>
  );
};

interface WeatherHeaderProps {
  location: ForecastLocation | undefined;
}

const WeatherHeader = ({ location }: WeatherHeaderProps) => {
  if (!location) {
    return null;
  }

  const date = new Date(location.localtime);
  const day = date.toLocaleDateString("en-us", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const time = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="ml-8 mt-10 flex w-full flex-col justify-center">
      <h1 className="text-4xl font-bold text-gray-200">
        {location.name}, {location.region}
      </h1>
      <h2 className="flex items-center">
        Last updated: {day}
        <span className="mx-2">
          <FiMinus />
        </span>
        {time}
      </h2>
    </div>
  );
};

interface WeatherForecastProps {
  forecast: WeatherForecastJSON | undefined;
}

const WeatherForecast = (props: WeatherForecastProps) => {
  if (!props.forecast) {
    return null;
  }

  const { forecast } = props.forecast;

  return (
    <div className="mt-10 flex w-full flex-row justify-center">
      {forecast.forecastday.map((day) => (
        <WeatherDay key={day.date} forecastDay={day} />
      ))}
    </div>
  );
};

interface WeatherDayProps {
  forecastDay: ForecastDay;
}

const WeatherDay = (props: WeatherDayProps) => {
  const {
    forecastDay: { date: forecastDate, astro, day },
  } = props;

  // console.log(day);

  const date = new Date(forecastDate);
  const dayOfWeek = date.toLocaleDateString("en-us", { weekday: "long" });
  const dateOfMonth = date.toLocaleDateString("en-us", {
    month: "short",
    day: "numeric",
  });

  const hasPrecipitation =
    day.daily_will_it_rain > 0 || day.daily_will_it_snow > 0;
  const precipitationType =
    day.daily_chance_of_rain > day.daily_chance_of_snow ? "rain" : "snow";
  const units = precipitationType === "rain" ? "in" : "cm";

  return (
    <div className="card mx-4 w-72 bg-neutral shadow-xl">
      <figure className="px-8 pt-8">
        <Image
          src={`https:${day.condition.icon}`}
          alt={day.condition.text}
          className="mb-4 mt-2 h-20 w-20"
          width={64}
          height={64}
        />
      </figure>
      <div className="card-title flex-col gap-0">
        <h2 className="text-2xl">{dayOfWeek}</h2>
        <h3 className="text-semibold text-xl">{dateOfMonth}</h3>
      </div>
      <div className="mb-4 mt-6">
        <h1 className="mb-1 text-center text-3xl font-semibold">
          {day.avgtemp_f}° F
        </h1>
        <div className="flex justify-center gap-3">
          <div className="flex items-center gap-2">
            <FiTrendingDown />
            <p>{day.mintemp_f}</p>
          </div>
          <div className="flex items-center gap-2">
            <FiTrendingUp />
            <p>{day.maxtemp_f}</p>
          </div>
        </div>
      </div>
      <div className="card-body items-center text-center">
        <div className="flex justify-between gap-2">
          <div className="flex items-center gap-2">
            <FiSunrise />
            <p className="text-gray-400">{astro.sunrise}</p>
          </div>
          <div className="flex items-center gap-2">
            <FiSunset />
            <p className="text-gray-400">{astro.sunset}</p>
          </div>
        </div>
        <div>
          <p>{day.condition.text}</p>
          {hasPrecipitation ? (
            <p>
              Expected {precipitationType}:{" "}
              {day.totalprecip_in || day.totalsnow_cm} {units}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Weather;
