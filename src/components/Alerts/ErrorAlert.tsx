import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";

interface ErrorAlertProps {
  error?: Error;
  message?: string;
}

export const ErrorAlert = (props: ErrorAlertProps) => {
  console.error(props.message ? props.message : props.error?.stack);

  const [show, setShow] = useState(!!props.message || !!props.error);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShow(false);
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  return show ? (
    <div className="absolute left-2 bottom-2">
      <div className="alert alert-error">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="stroke-current shrink-0 h-6 w-6"
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
        <button className="btn btn-square btn-outline btn-xs" onClick={() => setShow(false)}>
          <FiX size={14} />
        </button>
      </div>
    </div>
  ) : null;
};
