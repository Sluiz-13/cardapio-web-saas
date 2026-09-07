"use client";

export function Toggle({
  checked,
  onChange,
  size = "md",
}: {
  checked: boolean;
  onChange: () => void;
  size?: "sm" | "md";
}) {
  const dims =
    size === "md"
      ? { w: "w-12", h: "h-7", dot: "w-5 h-5", on: "26px", off: "4px" }
      : { w: "w-10", h: "h-6", dot: "w-4 h-4", on: "20px", off: "4px" };
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative ${dims.w} ${dims.h} rounded-full transition-colors duration-[180ms] shrink-0`}
      style={{ background: checked ? "#059669" : "#D1D5DB" }}
    >
      <span
        className={`absolute top-1 ${dims.dot} rounded-full bg-white shadow-sm transition-all duration-[180ms]`}
        style={{ left: checked ? dims.on : dims.off }}
      />
    </button>
  );
}