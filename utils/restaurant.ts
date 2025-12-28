// Restaurant open/close status utilities
const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export interface OperatingHours {
  [key: string]: {
    open: string;
    close: string;
    isOpen: boolean;
  };
}

export interface RestaurantStatus {
  isOpen: boolean;
  message: string;
  opensAt?: string;
  closesAt?: string;
}

export const getRestaurantStatus = (operatingHours?: OperatingHours): RestaurantStatus => {
  if (!operatingHours) {
    return { isOpen: false, message: 'Hours not available' };
  }

  const now = new Date();
  const currentDay = DAYS[now.getDay()];
  const todayHours = operatingHours[currentDay];

  console.log('DEBUG getRestaurantStatus:', {
    currentDay,
    todayHours,
    currentTime: `${now.getHours()}:${now.getMinutes()}`,
  });

  // Check if restaurant is marked as closed for today OR no hours defined
  if (!todayHours || todayHours.isOpen === false) {
    console.log('DEBUG: Restaurant marked as closed or no hours');
    // Find next open day
    const nextOpenDay = findNextOpenDay(operatingHours, now.getDay());
    if (nextOpenDay) {
      return {
        isOpen: false,
        message: `Opens ${nextOpenDay.day} at ${formatTime(nextOpenDay.hours.open)}`,
        opensAt: nextOpenDay.hours.open,
      };
    }
    return { isOpen: false, message: 'Currently closed' };
  }

  // Restaurant is marked as open today - now check time
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = todayHours.open.split(':').map(Number);
  const [closeHour, closeMin] = todayHours.close.split(':').map(Number);
  
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  console.log('DEBUG time check:', {
    currentMinutes,
    openMinutes,
    closeMinutes,
    isBeforeOpen: currentMinutes < openMinutes,
    isAfterClose: currentMinutes >= closeMinutes,
  });

  // Before opening time
  if (currentMinutes < openMinutes) {
    return {
      isOpen: false,
      message: `Opens today at ${formatTime(todayHours.open)}`,
      opensAt: todayHours.open,
    };
  }

  // After closing time
  if (currentMinutes >= closeMinutes) {
    const nextOpenDay = findNextOpenDay(operatingHours, now.getDay());
    if (nextOpenDay) {
      return {
        isOpen: false,
        message: `Opens ${nextOpenDay.day} at ${formatTime(nextOpenDay.hours.open)}`,
        opensAt: nextOpenDay.hours.open,
      };
    }
    return { isOpen: false, message: 'Closed for today' };
  }

  // Restaurant is open - check if closing soon
  const minutesUntilClose = closeMinutes - currentMinutes;
  if (minutesUntilClose <= 30) {
    return {
      isOpen: true,
      message: `Closes in ${minutesUntilClose} min`,
      closesAt: todayHours.close,
    };
  }

  console.log('DEBUG: Restaurant is OPEN');
  return {
    isOpen: true,
    message: `Open until ${formatTime(todayHours.close)}`,
    closesAt: todayHours.close,
  };
};

const findNextOpenDay = (operatingHours: OperatingHours, currentDayIndex: number) => {
  for (let i = 1; i <= 7; i++) {
    const dayIndex = (currentDayIndex + i) % 7;
    const dayName = DAYS[dayIndex];
    const hours = operatingHours[dayName];
    
    if (hours?.isOpen) {
      const displayDay = i === 1 ? 'tomorrow' : dayName.charAt(0).toUpperCase() + dayName.slice(1);
      return { day: displayDay, hours };
    }
  }
  return null;
};

const formatTime = (time: string): string => {
  const [hour, minute] = time.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
};

export const formatPrice = (price: number): string => {
  return `₹${price}`;
};
