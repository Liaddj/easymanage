export const DEMO_PASSWORD = "demo123";

export const DEMO_USERS = [
  {
    id: "u_coach",
    role: "provider",
    email: "coach@flow.demo",
    name: "נועה כהן",
    nameEn: "Noa Cohen",
    city: "תל אביב",
    cityEn: "Tel Aviv",
    specialty: "טניס · כושר",
    specialtyEn: "Tennis · Fitness",
  },
  {
    id: "u_client",
    role: "client",
    email: "client@flow.demo",
    name: "דני לוי",
    nameEn: "Dani Levi",
    city: "תל אביב",
    cityEn: "Tel Aviv",
  },
  {
    id: "u_michal",
    role: "client",
    email: "michal@flow.demo",
    name: "מיכל אברהם",
    nameEn: "Michal Avraham",
    city: "רמת גן",
    cityEn: "Ramat Gan",
  },
  {
    id: "u_yossi",
    role: "client",
    email: "yossi@flow.demo",
    name: "יוסי פרץ",
    nameEn: "Yossi Peretz",
    city: "חולון",
    cityEn: "Holon",
  },
];

/** Sunday–Thursday 07–19, Friday 08–12. Saturday off. */
export function defaultAvailability() {
  const slots = [];
  for (let weekday = 0; weekday <= 4; weekday += 1) {
    for (let hour = 7; hour <= 19; hour += 1) {
      slots.push({ weekday, hour });
    }
  }
  for (let hour = 8; hour <= 12; hour += 1) {
    slots.push({ weekday: 5, hour });
  }
  return slots;
}

export function availabilityKey(weekday, hour) {
  return `${weekday}-${hour}`;
}
