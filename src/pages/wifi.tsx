import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { cn } from "utils-toolkit";

const WifiPage = () => {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession({
    required: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [passwordTimeout, setPasswordTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );

  const resetPasswordTimeout = useCallback(() => {
    if (passwordTimeout) {
      clearTimeout(passwordTimeout);
      setPasswordTimeout(null);
    }
  }, [passwordTimeout]);

  useEffect(() => {
    if (!showPassword) {
      resetPasswordTimeout();
      return;
    }

    if (passwordTimeout) {
      return;
    }

    setPasswordTimeout(
      setTimeout(() => {
        setShowPassword(false);
      }, 5000),
    );
  }, [passwordTimeout, resetPasswordTimeout, showPassword]);

  if (sessionStatus === "authenticated" && session?.user?.role !== "admin") {
    void router.replace("/");
  }

  const loading = sessionStatus === "loading";

  const EyeIcon = showPassword ? FiEyeOff : FiEye;

  return (
    <>
      <div className="flex w-full items-center justify-start gap-x-4 px-14 py-8">
        <h1 className="text-4xl font-bold text-gray-200">Wi-Fi</h1>
        {loading ? (
          <span className="loading loading-spinner loading-md text-accent" />
        ) : null}
      </div>
      <div className="mt-6 flex h-full flex-col gap-y-4">
        <Image
          alt="wifi qr code"
          src="/qr-code.png"
          width={512}
          height={512}
          className="h-auto w-auto"
          priority
        />
        <div className="divider"></div>
        <div
          className={cn(
            "stats stats-vertical shadow lg:stats-horizontal",
            "bg-neutral",
          )}
        >
          <div className="stat">
            <div className="stat-title">Network</div>
            <div className={cn("stat-value", "text-xl")}>
              INTERNET JUICE GUEST
            </div>
          </div>
          <div className="stat">
            <div className="stat-title">Password</div>
            <div
              className={cn(
                "stat-value flex justify-between space-x-2",
                "text-xl",
              )}
            >
              <span>{showPassword ? "sky34lguest" : "·".repeat(10)}</span>
              <button className="btn btn-circle btn-info btn-xs">
                <EyeIcon
                  size={14}
                  onClick={() =>
                    setShowPassword((prevShowPassword) => {
                      if (prevShowPassword) {
                        resetPasswordTimeout();
                      }
                      return !prevShowPassword;
                    })
                  }
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default WifiPage;
