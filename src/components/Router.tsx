import { HashRouter, Route, Routes } from "react-router-dom";

import Calendar from "@pages/calendar";
import Error from "@pages/error";
import Index from "@pages/index";
import Weather from "@pages/weather";

const Router = () => {
  return (
    <HashRouter basename={"/"}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/weather" element={<Weather />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/error" element={<Error />} />
      </Routes>
    </HashRouter>
  );
};

export default Router;
