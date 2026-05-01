export default function Logo({ tagline = null }) {
  return (
    <div className="flex flex-col items-center gap-3 mb-8">
      <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          {/* Corona del diente */}
          <path
            d="M7 5C7 5 9 3 11 4C12.5 4.7 13.5 5 16 5C18.5 5 19.5 4.7 21 4C23 3 25 5 25 5C26.5 6.5 27 9 26 12C25.5 13.5 25 15 25 17L24 26C23.8 27.2 23 28 22 28C21 28 20.3 27.2 20 26L19 21C18.8 20.2 18.2 20 18 20H14C13.8 20 13.2 20.2 13 21L12 26C11.7 27.2 11 28 10 28C9 28 8.2 27.2 8 26L7 17C7 15 6.5 13.5 6 12C5 9 5.5 6.5 7 5Z"
            fill="white"
          />
        </svg>
      </div>

      <div className="text-center">
        <h1 className="text-xl font-bold text-gray-800 tracking-tight">DentalApp</h1>
        {tagline && (
          <p className="text-xs text-gray-500 mt-0.5">{tagline}</p>
        )}
      </div>
    </div>
  );
}
