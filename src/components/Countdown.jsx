import { useEffect, useState } from "react";

function getTimeLeft(targetDate) {
  const total = targetDate - new Date().getTime();

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds };
}

export default function Countdown({ date }) {
  const target = new Date(date).getTime();
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(target));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(target));
    }, 1000);

    return () => clearInterval(interval);
  }, [target]);

  return (
    <div className="countdown">
      <div className="timeBox">
        <span className="num">{timeLeft.days}</span>
        <span className="label">dias</span>
      </div>

      <div className="timeBox">
        <span className="num">{timeLeft.hours}</span>
        <span className="label">horas</span>
      </div>

      <div className="timeBox">
        <span className="num">{timeLeft.minutes}</span>
        <span className="label">min</span>
      </div>

      <div className="timeBox">
        <span className="num">{timeLeft.seconds}</span>
        <span className="label">seg</span>
      </div>
    </div>
  );
}
