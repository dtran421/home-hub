import { HashRouter, Route, Routes } from "react-router-dom";

import Index from "@pages/index";
import Error from "@pages/error";
import Weather from "@pages/weather";
import Calendar from "@pages/calendar";

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
