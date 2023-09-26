import {
  type Dispatch,
  Fragment,
  type SetStateAction,
  useCallback,
  useReducer,
  useState,
} from "react";

import {
  CalendarNav,
  CalendarNext,
  CalendarPrev,
  CalendarToday,
  Eventcalendar,
  type MbscCalendarEvent,
  type MbscEventcalendarView,
  type MbscEventClickEvent,
  Page,
  SegmentedGroup,
  SegmentedItem,
  Toast,
} from "@mobiscroll/react";

// * make sure to import the calendar css before components
import "@mobiscroll/react/dist/css/mobiscroll.min.css";

type MbscCalendarViewType = "day" | "week" | "month" /* | "year" */;

const getCalendarView = (view: MbscCalendarViewType): MbscEventcalendarView => {
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
  events: MbscCalendarEvent[] | null;
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

  const viewReducer = (
    _state: CalendarView,
    action: { type: MbscCalendarViewType },
  ) => {
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
    <Page className="h-full w-full">
      <Eventcalendar
        theme="ios"
        themeVariant="dark"
        renderHeader={() => (
          <CalendarNavButtons
            viewType={calendarView.type}
            changeView={setCalendarView}
          />
        )}
        view={calendarView.view}
        data={props.events ?? []}
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
  viewType: MbscCalendarViewType;
  changeView: Dispatch<{
    type: MbscCalendarViewType;
  }>;
}

const CalendarNavButtons = (props: CalendarNavButtonsProps) => {
  return (
    <Fragment>
      <CalendarNav className="cal-header-nav" />
      <div className="cal-header-picker">
        <SegmentedGroup
          value={props.viewType}
          onChange={(e: { target: { value: MbscCalendarViewType } }) =>
            props.changeView({ type: e.target.value })
          }
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
