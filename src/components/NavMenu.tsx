import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import { FiCalendar, FiCloud, FiHome, FiLogOut, FiWifi } from "react-icons/fi";
import { cn } from "utils-toolkit";

export const NavMenu = () => {
  const session = useSession();
  const router = useRouter();

  const LINKS = useMemo(() => {
    const links = [
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
    ];

    if (session.data?.user.role === "admin") {
      links.push({
        href: "/wifi",
        icon: <FiWifi />,
      });
    }

    return links;
  }, [session.data?.user.role]);

  if (!session.data?.user) {
    return null;
  }

  const activePage = router.pathname.slice(1) || "";

  return (
    <div className="absolute bottom-4 left-1/2 z-50 flex -translate-x-1/2 gap-x-2">
      <ul className="menu rounded-box menu-horizontal bg-base-200">
        {LINKS.map((link) => (
          <li
            key={link.href}
            className={cn("", {
              "text-accent": activePage === link.href.slice(1),
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
