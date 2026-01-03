import { OperatingHours } from '../utils/restaurant';

export interface TimeSlot {
  label: string;
  value: Date;
}

export const generateTimeSlots = (operatingHours?: OperatingHours): TimeSlot[] => {
  const slots: TimeSlot[] = [];
  const now = new Date();
  const minTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 mins from now

  // Generate slots for today and tomorrow
  for (let dayOffset = 0; dayOffset <= 1; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof OperatingHours;
    const hours = operatingHours?.[dayName];

    if (!hours?.isOpen) continue;

    const [openH, openM] = hours.open.split(':').map(Number);
    const [closeH, closeM] = hours.close.split(':').map(Number);

    // Generate 30-min slots
    for (let h = openH; h <= closeH; h++) {
      for (let m = 0; m < 60; m += 30) {
        if (h === closeH && m > closeM) break;
        if (h === openH && m < openM) continue;

        const slotTime = new Date(date);
        slotTime.setHours(h, m, 0, 0);

        // Skip past slots
        if (slotTime <= minTime) continue;
        // Max 24 hours ahead
        if (slotTime.getTime() - now.getTime() > 24 * 60 * 60 * 1000) break;

        const dayLabel = dayOffset === 0 ? 'Today' : 'Tomorrow';
        const timeLabel = slotTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

        slots.push({
          label: `${dayLabel}, ${timeLabel}`,
          value: slotTime,
        });
      }
    }
  }

  return slots;
};

export const formatScheduledTime = (date: Date): string => {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = date.toDateString() === tomorrow.toDateString();

  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  
  if (isToday) return `Today, ${timeStr}`;
  if (isTomorrow) return `Tomorrow, ${timeStr}`;
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + `, ${timeStr}`;
};
