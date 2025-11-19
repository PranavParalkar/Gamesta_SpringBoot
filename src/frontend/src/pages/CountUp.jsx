import { useEffect, useState } from "react";

export default function CountUp({
  to,
  duration = 1,
  separator = "",
  className = "",
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    const startValue = 0;
    const endValue = to;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min(
        (currentTime - startTime) / (duration * 1000),
        1
      );

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(
        startValue + (endValue - startValue) * easeOutQuart
      );

      setCount(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(endValue);
      }
    };

    requestAnimationFrame(animate);
  }, [to, duration]);

  const formattedCount = separator
    ? count.toLocaleString("en-US")
    : count.toString();

  return <span className={className}>{formattedCount}</span>;
}
