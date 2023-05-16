import { useId } from "react";

export function Logo(props) {
  let id = useId();

  return (
    <div className="flex flex-wrap items-center">
      <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" {...props}>
        <title>SimpleQ</title>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M31.75 18h-8.13a8 8 0 01-15.5 0H0a16 16 0 0031.75 0zm0-4h-8.13a8 8 0 00-15.5 0H0a16 16 0 0131.75 0z"
          fill={`url(#${id}-g)`}
        />
        <defs>
          <linearGradient id={`${id}-g`} x1={15.88} y1={0} x2={15.88} y2={32} gradientUnits="userSpaceOnUse">
            <stop stopColor="#AAE4FF" />
            <stop offset={1} stopColor="#38BDF8" />
          </linearGradient>
        </defs>
      </svg>
      <h2 className="ml-2 h-fit text-2xl font-bold">SimpleQ</h2>
    </div>
  );
}
