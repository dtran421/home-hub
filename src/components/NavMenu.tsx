import { FiCalendar, FiCloud, FiDollarSign, FiHome } from "react-icons/fi";

export const NavMenu = () => {
  // const location = useLocation();
  // const activePage = location.pathname.slice(1);
  const activePage = "";

  return (
    <div className="absolute bottom-4 z-50">
      <ul className="menu menu-horizontal bg-base-200 rounded-box">
        <li className={`${activePage === "" ? "active" : null}`}>
          <Link to="/">
            <FiHome />
          </Link>
        </li>
        <li className={`${activePage === "weather" ? "active" : null}`}>
          <Link to="/weather">
            <FiCloud />
          </Link>
        </li>
        <li className={`${activePage === "calendar" ? "active" : null}`}>
          <Link to="/calendar">
            <FiCalendar />
          </Link>
        </li>
        <li>
          <a>
            <FiDollarSign />
          </a>
        </li>
      </ul>
    </div>
  );
};
