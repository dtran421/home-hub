import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";

interface ErrorAlertProps {
  error?: Error;
  message?: string;
}

export const ErrorAlert = (props: ErrorAlertProps) => {
  const [show, setShow] = useState(!!props.message || !!props.error);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      console.error(props.message ? props.message : props.error?.stack);
      setIsInitialized(true);
    }

    const timeout = setTimeout(() => {
      setShow(false);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isInitialized, props.error?.stack, props.message]);

  return show ? (
    <div className="absolute bottom-2 left-2">
      <div className="alert alert-error">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 shrink-0 stroke-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{props.message ? props.message : props.error?.message}</span>
        <button
          className="btn btn-square btn-outline btn-xs"
          onClick={() => setShow(false)}
        >
          <FiX size={14} />
        </button>
      </div>
    </div>
  ) : null;
};
