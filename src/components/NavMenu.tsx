import Link from "next/link";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import { FiCalendar, FiCloud, FiHome, FiLogOut, FiWifi } from "react-icons/fi";
import { cn } from "utils-toolkit";

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
    href: "/wifi",
    icon: <FiWifi />,
  },
];

export const NavMenu = () => {
  const session = useSession();
  const router = useRouter();

  if (!session.data?.user) {
    return null;
  }

  const activePage = router.pathname.slice(1) || "";

  return (
    <div className="absolute bottom-4 z-50 flex gap-x-2">
      <ul className="menu rounded-box menu-horizontal bg-base-200">
        {LINKS.map((link) => (
          <li
            key={link.href}
            className={cn("", {
              "active text-accent": activePage === link.href.slice(1),
            })}
          >
            <Link href={link.href}>{link.icon}</Link>
          </li>
        ))}
      </ul>
      <div className="tooltip" data-tip="Logout">
        <button
          className={cn("btn btn-square", "rounded-2xl")}
          onClick={() => void signOut({ callbackUrl: "/" })}
        >
          <FiLogOut />
        </button>
      </div>
    </div>
  );
};
