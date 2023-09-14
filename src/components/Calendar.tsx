import { useState, useCallback, Fragment, Dispatch, SetStateAction, useReducer } from "react";
// * make sure to import the calendar css before components
import "@mobiscroll/react/dist/css/mobiscroll.min.css";
import {
  MbscEventClickEvent,
  Page,
  Eventcalendar,
  Toast,
  CalendarNav,
  CalendarNext,
  CalendarPrev,
  SegmentedGroup,
  SegmentedItem,
  MbscEventcalendarView,
  MbscCalendarEvent,
  CalendarToday,
} from "@mobiscroll/react";

const getCalendarView = (view: string): MbscEventcalendarView => {
  switch (view) {
    case "month":
      return {
        calendar: { type: "month" },
      };
    case "week":
      return {
        calendar: { type: "week" },
        agenda: { type: "week" },
      };
    case "day":
      return {
        agenda: { type: "day" },
      };
    default:
      throw new Error("Invalid view");
  }
};

interface CalendarView {
  type: string;
  view: MbscEventcalendarView;
}

interface CalendarProps {
  events: MbscCalendarEvent[] | undefined;
  setError: Dispatch<SetStateAction<string>>;
}

export const Calendar = (props: CalendarProps) => {
  const [isToastOpen, setToastOpen] = useState(false);
  const [toastText, setToastText] = useState("");

  const closeToast = useCallback(() => {
    setToastOpen(false);
  }, []);

  const onEventClick = useCallback((event: MbscEventClickEvent) => {
    setToastText(event.event.title ?? "");
    setToastOpen(true);
  }, []);

  const viewReducer = (_state: CalendarView, action: { type: string }) => {
    return {
      type: action.type,
      view: getCalendarView(action.type),
    };
  };

  const [calendarView, setCalendarView] = useReducer(viewReducer, {
    type: "month",
    view: getCalendarView("month"),
  });

  return (
    <Page className="w-full h-full">
      <Eventcalendar
        theme="ios"
        themeVariant="dark"
        renderHeader={() => (
          <CalendarNavButtons viewType={calendarView.type} changeView={setCalendarView} />
        )}
        view={calendarView.view}
        data={props.events}
        clickToCreate={false}
        dragToCreate={false}
        dragToMove={false}
        dragToResize={false}
        eventDelete={false}
        onEventClick={onEventClick}
      />
      <Toast message={toastText} isOpen={isToastOpen} onClose={closeToast} />
    </Page>
  );
};

interface CalendarNavButtonsProps {
  viewType: string;
  changeView: Dispatch<{
    type: string;
  }>;
}

const CalendarNavButtons = (props: CalendarNavButtonsProps) => {
  return (
    <Fragment>
      <CalendarNav className="cal-header-nav" />
      <div className="cal-header-picker">
        <SegmentedGroup
          value={props.viewType}
          onChange={(e: any) => props.changeView({ type: e.target.value })}
        >
          <SegmentedItem value="month" icon="material-event-note" />
          <SegmentedItem value="week" icon="material-date-range" />
          <SegmentedItem value="day" icon="material-view-day" />
        </SegmentedGroup>
      </div>
      <CalendarPrev className="cal-header-prev" />
      <CalendarToday className="cal-header-today" />
      <CalendarNext className="cal-header-next" />
    </Fragment>
  );
};
