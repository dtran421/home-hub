import { type Dispatch, type SetStateAction } from "react";

import { type EventInput } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";

interface CalendarProps {
  events: EventInput[] | null;
  setError: Dispatch<SetStateAction<string>>;
}

export const Calendar = (props: CalendarProps) => {
  return (
    <div className="h-full w-full rounded-xl bg-base-200 p-6">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin]}
        headerToolbar={{
          left: "prev,today,next",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        initialView="dayGridMonth"
        themeSystem="litera"
        events={props.events ?? []}
        dayMaxEvents
        nowIndicator
      />
    </div>
  );
};
