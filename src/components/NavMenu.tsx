import Link from "next/link";
import { useRouter } from "next/router";
import { FiCalendar, FiCloud, FiDollarSign, FiHome } from "react-icons/fi";

const LINKS = [
  {
    href: "/",
    icon: <FiHome />,
  },
  {
    href: "/weather",
    icon: <FiCloud />,
  },
  {
    href: "/calendar",
    icon: <FiCalendar />,
  },
  {
    href: "/financials",
    icon: <FiDollarSign />,
  },
];

export const NavMenu = () => {
  const router = useRouter();
  const activePage = router.pathname.slice(1) || "";

  return (
    <div className="absolute bottom-4 z-50">
      <ul className="menu menu-horizontal bg-base-200 rounded-box">
        {LINKS.map((link) => (
          <li
            key={link.href}
            className={`${
              activePage === link.href.slice(1) ? "text-accent" : null
            }`}
          >
            <Link href={link.href}>{link.icon}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
