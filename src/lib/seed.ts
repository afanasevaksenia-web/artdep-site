export type CrewStatus = "unseen" | "seen" | "going" | "on-set";

export type Person = {
  id: string;
  name: string;
  role: string;
  dept: string;
  call: string;
  phone?: string;
  status: CrewStatus;
};

export type BlockKind = "scene" | "break" | "move" | "prep";

export type DayBlock = {
  id: string;
  start: string;
  end: string;
  dur: string;
  kind: BlockKind;
  scene?: string;
  pages?: string;
  heading: string;
  loc?: string;
  dayType?: string;
  synopsis?: string;
  cast?: string[];
  extras?: string[];
  props?: string;
  extraGear?: string;
  stunts?: string;
  note?: string;
};

export type Task = {
  id: string;
  dept: string;
  col: "к смене" | "в работе" | "готово" | "блокер";
  title: string;
  scene: string;
  who: string;
};

export type ChatMsg = {
  id: string;
  who: string;
  me?: boolean;
  t: string;
  text: string;
  shot?: string;
  link?: { label: string; href: string };
};

export type Chat = {
  id: string;
  name: string;
  kind: "Общий" | "Цех" | "Сцена";
  dept?: string;
  unread: number;
  last: string;
  pinned?: boolean;
};

export const project = {
  title: "Община",
  day: 53,
  dateLabel: "10 июля, пятница",
  dateIso: "2026-07-10",
  location: "Хаапалампи · старое кладбище / Патанино",
  weather: "Облачно, небольшой дождь · +17°",
  sunrise: "03:59",
  sunset: "21:11",
  shiftStart: "14:00",
  motor: "15:50",
  stopMotor: "02:00",
  lunch: "19:40–20:40",
  runtime: "06:55",
  sceneCount: 8,
  nextDay: {
    dateLabel: "11 июля · отсыпной",
    weather: "",
    objects: ["смена не запланирована"],
  },
};

export type DayNote = {
  id: string;
  day: string;
  kind: "правка" | "площадка" | "локация" | "каскад" | "цех";
  title: string;
  body: string;
  scene?: string;
  who: string;
  t: string;
  links?: { label: string; href: string }[];
};

export const notesSeed: DayNote[] = [
  {
    id: "n-limit",
    day: "10.07",
    kind: "площадка",
    title: "Ограничение по актёрам",
    body: "Ильин мл. Александр и Стеклов Данил — до 20:30 на площадке. Поезд из СПб 11 июля в 01:05.",
    scene: "5-4 / 5-5 / 5-6",
    who: "Пушкина Екатерина",
    t: "вызывной",
  },
  {
    id: "n-caravan",
    day: "10.07",
    kind: "локация",
    title: "Караван и точки",
    body: "Караван: Хаапалампи, Выборгское шоссе, 15, магазин «Продукты». Площадка 1 — старое кладбище. Площадка 2 — ул. Центральная, 1а.",
    who: "Локейшн",
    t: "вызывной",
    links: [
      {
        label: "Въезд на кладбище 61.654854, 30.616258",
        href: "https://yandex.ru/maps/?pt=30.616258,61.654854&z=16",
      },
    ],
  },
  {
    id: "n-pickup",
    day: "10.07",
    kind: "цех",
    title: "Доснять деталь 5-38 / 5-40",
    body: "Телефон Кости — проезд машины после визита в психбольницу, режим ночь.",
    who: "Гарипов Динар",
    t: "вызывной",
  },
];

export type DayEventKind = "перенос" | "замена" | "обед" | "погода" | "стоп" | "другое";

export type DayEvent = {
  id: string;
  t: string;
  kind: DayEventKind;
  title: string;
  body: string;
  who: string;
  lunch?: string | "отмена";
};

export const eventsSeed: DayEvent[] = [
  {
    id: "e-limit",
    t: "13:10",
    kind: "стоп",
    title: "Костя и Игорь до 20:30",
    body: "Ильин и Стеклов закрываем на 5-5. Поезд СПб 01:05. 5-6 — дублёр Кости за рулём, артиста не видим.",
    who: "Пушкина Екатерина",
  },
  {
    id: "e-su",
    t: "12:40",
    kind: "другое",
    title: "Second unit · 8-42 с 17:00",
    body: "Проезд буханки мимо борщевика снимает М. Вахитов. Человек в защитном костюме, опрыскиватель.",
    who: "Щелухина Александра",
  },
];

export type MenuMeal = "завтрак" | "обед" | "перекус" | "ночь" | "разнос";

export type MenuPost = {
  id: string;
  meal: MenuMeal;
  body: string;
  who: string;
  t: string;
};

export const menuSeed: MenuPost[] = [
  {
    id: "m-lunch",
    meal: "обед",
    t: "12:15",
    who: "Буфет",
    body: "Обед 19:40–20:40 у фудтрака. Суп, второе, салат, чай. После обеда — подготовка к 5-6, ночь.",
  },
];

export const transportNotes = [
  "Автобус группы: Мерседес спринтер синий О 372 АК 10 · водитель Аркадий +7 921 221-10-06",
  "Точка 1 · 13:35 ул. Садовая, 7 — 2 реж. площадка, асс. по актёрам, скрипт, администрация",
  "Точка 2 · 13:40 Выборгское шоссе, 23 Лукойл — 2 оператор, фокус-пуллер",
  "Точка 3 · 13:45 ул. Лунинская, 6А — помощник режиссёра, костюм",
  "Автобус АМС: спринтер белый Н 880 ЕК 198 · Сергей +7 981 970-97-75 · сбор 13:50 Садовая 7",
  "Машина режиссёра BMW C 593 MM 193 выезд 13:40 · оператора BMW E 517 EC 09 выезд 13:40",
];

export const people: Person[] = [
  { id: "ad2", name: "Пушкина Екатерина", role: "Второй режиссёр (площадка)", dept: "Площадка", call: "14:00", phone: "+7 915 324-99-88", status: "on-set" },
  { id: "dir", name: "Гарипов Динар", role: "Режиссёр-постановщик", dept: "Режиссура", call: "14:00", phone: "+7 985 929-25-55", status: "going" },
  { id: "dp", name: "Малышев Роман", role: "Оператор-постановщик", dept: "Операторы", call: "14:00", phone: "+7 925 736-44-90", status: "seen" },
  { id: "pd", name: "Трубецкой Никита", role: "Художник-постановщик", dept: "Арт", call: "14:00", phone: "+7 926 164-83-49", status: "seen" },
  { id: "prod", name: "Ахмоева Юлия", role: "Исполнительный продюсер", dept: "Продюсеры", call: "14:00", phone: "+7 925 517-44-75", status: "going" },
  { id: "ad1", name: "Щелухина Александра", role: "Второй режиссёр (планирование)", dept: "Режиссура", call: "14:00", phone: "+7 926 140-87-55", status: "seen" },
  { id: "castas", name: "Терентьева Оксана", role: "Ассистент по актёрам", dept: "Площадка", call: "14:00", phone: "+7 925 574-77-32", status: "on-set" },
  { id: "props", name: "Антонов Александр", role: "Художник по реквизиту", dept: "Реквизит", call: "14:00", phone: "+7 968 863-16-96", status: "seen" },
  { id: "sound", name: "Бирюлин Гавриил", role: "Звукорежиссёр", dept: "Звук", call: "14:00", phone: "+7 921 942-39-74", status: "seen" },
  { id: "cos", name: "Кузина Виктория", role: "Ассистент художника по костюму", dept: "Костюм", call: "14:00", phone: "+7 901 723-62-77", status: "going" },
  { id: "mu", name: "Вахранева Александра", role: "Художник по гриму", dept: "Грим", call: "14:00", phone: "+7 916 308-83-55", status: "on-set" },
  { id: "ams", name: "Адель", role: "Бригадир АМС", dept: "АМС", call: "13:50", phone: "+7 981 134-59-52", status: "seen" },
  { id: "ud", name: "Казин Сергей", role: "Директор съёмочной группы", dept: "Площадка", call: "12:30", phone: "+7 903 219-17-58", status: "on-set" },
  { id: "ud2", name: "Закутский Константин", role: "Зам директора", dept: "Площадка", call: "12:30", phone: "+7 903 010-65-71", status: "on-set" },
  { id: "admin", name: "Милошевич Илья", role: "Администратор", dept: "Площадка", call: "12:30", phone: "+7 977 483-31-04", status: "on-set" },
  { id: "admin2", name: "Избасаров Тимур", role: "Администратор", dept: "Площадка", call: "12:30", phone: "+7 999 214-56-95", status: "going" },
  { id: "loc", name: "Локейшн", role: "Локейшн", dept: "Локейшн", call: "12:30", status: "on-set" },
  { id: "gaffer", name: "Осветитель подключения", role: "Свет · подключение", dept: "Свет", call: "12:30", status: "on-set" },
  { id: "crafty", name: "Фудтрак", role: "Буфет", dept: "АХЧ", call: "12:30", status: "on-set" },
  { id: "alina", name: "Савельева Дарья", role: "Алина", dept: "Актёры", call: "14:40", status: "going" },
  { id: "kostya", name: "Ильин мл. Александр", role: "Костя", dept: "Актёры", call: "15:00", status: "seen" },
  { id: "semen", name: "Харитонов Евгений", role: "Семён", dept: "Актёры", call: "14:10", status: "going" },
  { id: "vit", name: "Калимулин Эльдар", role: "Виталик", dept: "Актёры", call: "14:10", status: "seen" },
  { id: "igor", name: "Стеклов Данил", role: "Игорь", dept: "Актёры", call: "14:10", status: "seen" },
  { id: "puch", name: "Смирнов Геннадий", role: "Пучков", dept: "Актёры", call: "14:10", status: "going" },
  { id: "marina", name: "Франц Юлия", role: "Марина", dept: "Актёры", call: "14:10", status: "seen" },
  { id: "lena", name: "Протченко Марьяна", role: "Лена", dept: "Актёры", call: "15:00", status: "unseen" },
  { id: "alex", name: "Миронов-Сауль Александр", role: "Александр (Патанино)", dept: "Актёры", call: "17:00", status: "unseen" },
  { id: "mama", name: "Осипенко Людмила", role: "Мама Александра", dept: "Актёры", call: "20:40", status: "unseen" },
];

export type FloorRow = {
  id: string;
  kind: "dept" | "cast" | "transport";
  name: string;
  detail?: string;
  call: string;
  wrap: string;
};

export const floorDepts: FloorRow[] = [
  { id: "d-loc", kind: "dept", name: "Локейшн", call: "12:30", wrap: "02:00" },
  { id: "d-admin", kind: "dept", name: "Администрация", detail: "Милошевич / Избасаров", call: "12:30", wrap: "02:00" },
  { id: "d-gaffer0", kind: "dept", name: "Свет · подключение", call: "12:30", wrap: "02:00" },
  { id: "d-dir", kind: "dept", name: "Режиссура", detail: "Гарипов Динар", call: "14:00", wrap: "02:00" },
  { id: "d-ad2", kind: "dept", name: "Второй режиссёр", detail: "Пушкина Екатерина", call: "14:00", wrap: "02:00" },
  { id: "d-dp", kind: "dept", name: "Оператор-постановщик", detail: "Малышев Роман", call: "14:00", wrap: "02:00" },
  { id: "d-pd", kind: "dept", name: "Художник-постановщик", detail: "Трубецкой Никита", call: "14:00", wrap: "02:00" },
  { id: "d-mu", kind: "dept", name: "Грим", detail: "Вахранева Александра", call: "14:00", wrap: "02:00" },
  { id: "d-cos", kind: "dept", name: "Костюм", detail: "Кузина Виктория", call: "14:00", wrap: "02:00" },
  { id: "d-cam", kind: "dept", name: "2-й оператор / фокус", call: "14:00", wrap: "02:00" },
  { id: "d-gaffer", kind: "dept", name: "Осветители", call: "14:00", wrap: "02:00" },
  { id: "d-sound", kind: "dept", name: "Звук", detail: "Бирюлин Гавриил", call: "14:00", wrap: "02:00" },
  { id: "d-props", kind: "dept", name: "Реквизит", detail: "Антонов Александр", call: "14:00", wrap: "02:00" },
  { id: "d-ams", kind: "dept", name: "АМС", detail: "Адель", call: "13:50", wrap: "02:00" },
];

export const floorCast: FloorRow[] = [
  { id: "c-vit", kind: "cast", name: "Виталик", detail: "Калимулин Эльдар · 5-4, 5-5", call: "14:10", wrap: "19:30" },
  { id: "c-puch", kind: "cast", name: "Пучков", detail: "Смирнов Геннадий · 5-4, 5-5", call: "14:10", wrap: "19:30" },
  { id: "c-sem", kind: "cast", name: "Семён", detail: "Харитонов Евгений · 5-4, 5-5", call: "14:10", wrap: "19:30" },
  { id: "c-igor", kind: "cast", name: "Игорь", detail: "Стеклов Данил · до 20:30, поезд 01:05", call: "14:10", wrap: "19:30" },
  { id: "c-mar", kind: "cast", name: "Марина", detail: "Франц Юлия · 5-4, 5-5", call: "14:10", wrap: "19:30" },
  { id: "c-alina", kind: "cast", name: "Алина", detail: "Савельева Дарья · до стопа", call: "14:40", wrap: "02:00" },
  { id: "c-kos", kind: "cast", name: "Костя", detail: "Ильин мл. · до 20:30, поезд 01:05", call: "15:00", wrap: "22:05" },
  { id: "c-lena", kind: "cast", name: "Лена", detail: "Протченко Марьяна · 5-4, 5-5", call: "15:00", wrap: "19:30" },
  { id: "c-alex", kind: "cast", name: "Александр", detail: "Миронов-Сауль · 5-41, 5-42", call: "17:00", wrap: "01:15" },
  { id: "c-mama", kind: "cast", name: "Мама Александра", detail: "Осипенко Людмила · 5-42", call: "20:40", wrap: "01:15" },
  { id: "c-ex1", kind: "cast", name: "Сослуживцы в форме", detail: "8 чел. · 5-4, 5-5", call: "14:15", wrap: "19:30" },
  { id: "c-ex2", kind: "cast", name: "Сослуживцы в гражданском", detail: "6 чел.", call: "14:15", wrap: "19:30" },
  { id: "c-ex3", kind: "cast", name: "Гражданские в трауре", detail: "4 чел.", call: "14:15", wrap: "19:30" },
  { id: "c-dbl", kind: "cast", name: "Дублёр Кости (вождение)", detail: "5-6", call: "16:00", wrap: "22:05" },
];

export const floorTransport: FloorRow[] = [
  { id: "t-food", kind: "transport", name: "Фудтрак", call: "12:30", wrap: "02:00" },
  { id: "t-gen", kind: "transport", name: "Генератор", call: "12:20", wrap: "02:00" },
  { id: "t-lightbase", kind: "transport", name: "Светобаза-генератор", call: "12:30", wrap: "02:00" },
  { id: "t-bus", kind: "transport", name: "Автобус группы", detail: "синий О 372 АК 10", call: "13:35", wrap: "02:00" },
  { id: "t-ams", kind: "transport", name: "Автобус АМС", detail: "белый Н 880 ЕК 198", call: "13:50", wrap: "02:00" },
  { id: "t-mu", kind: "transport", name: "Гримваген", call: "13:00", wrap: "02:00" },
  { id: "t-cos", kind: "transport", name: "Костюмваген", call: "13:00", wrap: "02:00" },
  { id: "t-axh", kind: "transport", name: "АХЧ / туалет / штаб", call: "13:00", wrap: "02:00" },
  { id: "t-cam", kind: "transport", name: "Камерваген", call: "14:00", wrap: "02:00" },
  { id: "t-sound", kind: "transport", name: "Тонваген", call: "14:00", wrap: "02:00" },
  { id: "t-hw", kind: "transport", name: "Худваген", call: "14:00", wrap: "02:00" },
  { id: "t-pr", kind: "transport", name: "Реквизитваген", call: "14:00", wrap: "02:00" },
  { id: "t-kos", kind: "transport", name: "Машина Кости", call: "14:00", wrap: "22:05" },
  { id: "t-alina", kind: "transport", name: "Машина Алины", call: "14:00", wrap: "02:00" },
  { id: "t-vit", kind: "transport", name: "Машина Виталика", call: "14:00", wrap: "22:05" },
  { id: "t-uaz", kind: "transport", name: "УАЗ Патриот Пучкова", call: "14:00", wrap: "19:30" },
  { id: "t-pol", kind: "transport", name: "Полицейские машины (2)", call: "14:00", wrap: "22:05" },
  { id: "t-bg", kind: "transport", name: "Гражданские фоновые (2)", call: "14:00", wrap: "22:05" },
  { id: "t-buh", kind: "transport", name: "Буханка · second unit", detail: "8-42", call: "15:00", wrap: "19:00" },
];

export function hmToMin(hm: string) {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
}

export function minToHm(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function nowHm() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function overtimeOf(stop: string, wrap: string) {
  let d = hmToMin(stop) - hmToMin(wrap);
  if (hmToMin(wrap) < 12 * 60 && hmToMin(stop) > 12 * 60) return null;
  if (d < 0 && hmToMin(wrap) < 6 * 60) d += 24 * 60;
  if (d <= 0) return null;
  return minToHm(d);
}

export function shiftLen(start: string, end: string) {
  let d = hmToMin(end) - hmToMin(start);
  if (d < 0) d += 24 * 60;
  return minToHm(d);
}

export const blocks: DayBlock[] = [
  { id: "prep", start: "14:00", end: "15:30", dur: "01:30", kind: "prep", heading: "Грим / костюм, техническое освоение" },
  { id: "walk", start: "15:30", end: "15:40", dur: "00:10", kind: "prep", heading: "Доводим артистов на площадку" },
  { id: "reh1", start: "15:40", end: "15:50", dur: "00:10", kind: "prep", heading: "Репетиция" },
  {
    id: "5-4",
    start: "15:50",
    end: "17:50",
    dur: "02:00",
    kind: "scene",
    scene: "5-4",
    pages: "01:00",
    heading: "Могила Семёна",
    loc: "КЛАДБИЩЕ. МОГИЛА СЕМЁНА",
    dayType: "УТРО 9 Нат",
    synopsis:
      "Сослуживцы у памятника. Пучков произносит речь. Костя в футболке «Крутой перец» молчит, суёт леденец. Алина наблюдает сзади.",
    cast: ["Алина", "Костя", "Виталик", "Семён", "Марина", "Лена", "Игорь", "Пучков"],
    extras: ["Сослуживцы в форме (8)", "в гражданском (6)", "в трауре (4)"],
    props: "гвоздики, букеты (20), фото Семёна на памятник, часы Кости, рюкзак Алины, леденцы",
    extraGear: "2-я камера",
    note: "Все игровые машины на пятачке у могилы.",
  },
  { id: "move1", start: "17:50", end: "18:20", dur: "00:30", kind: "move", heading: "Перестановка / репетиция 5-5" },
  {
    id: "5-5",
    start: "18:20",
    end: "19:30",
    dur: "01:10",
    kind: "scene",
    scene: "5-5",
    pages: "01:00",
    heading: "У входа",
    loc: "КЛАДБИЩЕ. У ВХОДА",
    dayType: "УТРО 9 Нат",
    synopsis: "Пучков не понимает Костю. Марина с Леной едут с Виталиком. Костя уезжает, Алина за ним.",
    cast: ["Алина", "Костя", "Виталик", "Семён", "Марина", "Лена", "Игорь", "Пучков"],
    extras: ["Сослуживцы в форме (8)", "в гражданском (6)", "в трауре (4)"],
    props: "часы Кости, рюкзак Алины",
    extraGear: "2-я камера",
    note: "Костя и Игорь после этой сцены — на поезд.",
  },
  { id: "lunch", start: "19:40", end: "20:40", dur: "01:00", kind: "break", heading: "Обед" },
  { id: "prep6", start: "20:40", end: "21:15", dur: "00:35", kind: "prep", heading: "Подготовка к 5-6" },
  {
    id: "5-6",
    start: "21:15",
    end: "22:05",
    dur: "00:50",
    kind: "scene",
    scene: "5-6",
    pages: "00:25",
    heading: "Дорога от кладбища",
    loc: "ДОРОГА. САЛОН МАШИНЫ АЛИНЫ",
    dayType: "УТРО 9 Нат/Инт",
    synopsis: "Костя сворачивает на Слюдянку. Алина звонит Виталику — где упал брат.",
    cast: ["Алина", "Костя — дублёр (артиста не видно)"],
    extras: ["Дублёр Кости (вождение)"],
    props: "телефон Алины, рюкзак",
    extraGear: "2-я камера, автоплейбек, сопровождение, перекрытие",
    note: "Указатель «Слюдянка». Артиста Костю не видим.",
  },
  { id: "move2", start: "22:05", end: "23:35", dur: "01:30", kind: "move", heading: "Переход на 2-ю точку · режим ночь" },
  {
    id: "5-37-2",
    start: "23:40",
    end: "23:55",
    dur: "00:15",
    kind: "scene",
    scene: "5-37-2",
    pages: "00:10",
    heading: "Съезд на просёлок",
    loc: "ТРАССА. ПРОЕЗД МАШИНЫ АЛИНЫ",
    dayType: "НОЧЬ 10 Нат/Инт",
    synopsis: "Алина едет в Патанино, к человеку из одной зоны с Феофаном и Богданом.",
    cast: ["Алина"],
    extraGear: "скай-лифт к 21:00",
  },
  { id: "move3", start: "23:55", end: "00:30", dur: "00:35", kind: "move", heading: "Перестановка / репетиция деревни" },
  {
    id: "5-39",
    start: "00:30",
    end: "02:00",
    dur: "01:30",
    kind: "scene",
    scene: "5-39",
    pages: "01:00",
    heading: "Въезд в деревню",
    loc: "ПАТАНИНО. ВЪЕЗД",
    dayType: "НОЧЬ 10 Нат",
    synopsis: "Умирающая деревня. Шум и крик из дома, потом тишина. Во дворе — велосипед, самокат, качели.",
    cast: ["Алина"],
    props: "велосипед, самокат, качели",
  },
  {
    id: "5-41",
    start: "00:30",
    end: "02:00",
    dur: "01:30",
    kind: "scene",
    scene: "5-41",
    pages: "00:45",
    heading: "Двор Александра",
    loc: "ПОТАНИНО. ДВОР",
    dayType: "НОЧЬ 10 Нат",
    synopsis: "«Ещё шаг и пуля в лоб». Александр с ружьём в трусах и майке. Помнит Феофана и Богдана.",
    cast: ["Алина", "Александр"],
    props: "ружьё, велосипед, самокат, качели, ходули, костыли",
    extraGear: "Aputure 5200 + Parabeam",
  },
  {
    id: "5-42",
    start: "00:30",
    end: "02:00",
    dur: "01:30",
    kind: "scene",
    scene: "5-42",
    pages: "02:15",
    heading: "Дом Александра",
    loc: "ПАТАНИНО. ДОМ",
    dayType: "НОЧЬ 10 Инт",
    synopsis: "Наседки, вышли по хулиганке. Общались с каким-то врачом. Мама орёт спать. Детские вещи — Сашуличкины, с 14 лет по зонам.",
    cast: ["Алина", "Александр", "Мама Александра"],
    extraGear: "2-я камера",
  },
];

export { kpp } from "./kpp-data";

export const scriptScenes = [
  {
    id: "5-4",
    heading: "5-4. НАТ. КЛАДБИЩЕ. МОГИЛА СЕМЁНА. УТРО 9",
    body: "Костя идёт спиной к кладбищу в футболке «Крутой перец». Пучков говорит речь про двухгодичную годовщину. Семён рядом: «Бедняжка. Мне даже жалко тебя». Костя суёт леденец, уходит без слова. Алина видит это метров с двадцати.",
  },
  {
    id: "5-5",
    heading: "5-5. НАТ. КЛАДБИЩЕ. У ВХОДА. УТРО 9",
    body: "Пучков: «То бухаешь полтора года, то вырядился как клоун». Костя: «Постирал просто все». Марина: «Нас Виталик довезёт. Лучше бы не приезжал». Лена: «Дядя Костя ты сегодня плохой». Костя уезжает, Алина за ним.",
  },
  {
    id: "5-6",
    heading: "5-6. НАТ/ИНТ. ДОРОГА ОТ КЛАДБИЩА. САЛОН АЛИНЫ. УТРО 9",
    body: "Костя не в город — на Слюдянку. Алина Виталику: «Брат Рогачева в районе Слюдянки упал?» — «С неё и упал. У нас скала такая есть».",
  },
  {
    id: "5-37-2",
    heading: "5-37-2. НАТ/ИНТ. ТРАССА. СЪЕЗД. НОЧЬ 10",
    body: "Алина по трассе, съезд на просёлок с указателем «Потанино».",
  },
  {
    id: "5-39",
    heading: "5-39. НАТ. ПАТАНИНО. ВЪЕЗД В ДЕРЕВНЮ. НОЧЬ 10",
    body: "Несколько домов, в одном свет и крик. Машина Алины. Шум гаснет, когда она выходит. Во дворе подростковые вещи. На крыльце свет в доме выключается.",
  },
  {
    id: "5-41",
    heading: "5-41. НАТ. ДВОР У ДОМА АЛЕКСАНДРА. НОЧЬ 10",
    body: "«Ещё шаг и пуля в лоб. Ты кто такая на хрен? Ментовская?» Алина про Ноздрева и Дрыкина, зона 2010. Мужик в трусах и майке, наколки, ружьё: «Помню я этих пидоров. Тута жди, штаны надену».",
  },
  {
    id: "5-42",
    heading: "5-42. ИНТ. ДОМ АЛЕКСАНДРА. НОЧЬ 10",
    body: "Наседки, кололи особо тяжких, вышли по хулиганке, четвертак минимум. С врачом из «лепил» общались. Мама в халате орёт спать. Детские вещи во дворе — Сашуличкины: «с четырнадцати по колониям катался, вот наверстывает».",
  },
];

export const chatsSeed: Chat[] = [
  { id: "all", name: "Общий · Община", kind: "Общий", unread: 0, last: "Катя: вызывной 10.07, смена 53", pinned: true },
  { id: "ad", name: "Площадка", kind: "Цех", dept: "Площадка", unread: 1, last: "Костя и Игорь до 20:30" },
  { id: "dir", name: "Режиссура", kind: "Цех", dept: "Режиссура", unread: 0, last: "5-6 без Ильина, дублёр за рулём" },
  { id: "cam", name: "Операторы", kind: "Цех", dept: "Операторы", unread: 0, last: "2-я камера на 5-4, 5-5, 5-6, 5-42" },
  { id: "light", name: "Свет", kind: "Цех", dept: "Свет", unread: 0, last: "Подключение 12:30, Aputure на 5-41" },
  { id: "sound", name: "Звук", kind: "Цех", dept: "Звук", unread: 0, last: "ЗК Виталика на 5-6" },
  { id: "mu", name: "Грим", kind: "Цех", dept: "Грим", unread: 0, last: "Кладбище с 14:10, Александр без грима" },
  { id: "cos", name: "Костюм", kind: "Цех", dept: "Костюм", unread: 0, last: "Футболка Кости «Крутой перец»" },
  { id: "loc", name: "Локейшн", kind: "Цех", dept: "Локейшн", unread: 1, last: "Въезд кладбище 61.654854, 30.616258" },
  { id: "axh", name: "Админка / транспорт", kind: "Цех", dept: "Площадка", unread: 0, last: "Автобус 13:35 Садовая 7" },
  { id: "s54", name: "Сцена 5-4 · могила", kind: "Сцена", unread: 1, last: "Машины на пятачке у памятника" },
  { id: "s55", name: "Сцена 5-5 · вход", kind: "Сцена", unread: 0, last: "После сцены Костя и Игорь на поезд" },
  { id: "s56", name: "Сцена 5-6 · Слюдянка", kind: "Сцена", unread: 0, last: "Дублёр, перекрытие, автоплейбек" },
  { id: "s5372", name: "Сцена 5-37-2 · трасса", kind: "Сцена", unread: 0, last: "Скай-лифт к 21:00" },
  { id: "s539", name: "Сцена 5-39 · въезд", kind: "Сцена", unread: 0, last: "Велосипед, самокат, качели" },
  { id: "s541", name: "Сцена 5-41 · двор", kind: "Сцена", unread: 0, last: "Ружьё, Aputure 5200" },
  { id: "s542", name: "Сцена 5-42 · дом", kind: "Сцена", unread: 0, last: "Мама к 20:40, готовность 22:00" },
];

export const messagesSeed: Record<string, ChatMsg[]> = {
  all: [
    {
      id: "m1",
      who: "Пушкина Екатерина",
      t: "12:05",
      text: "Вызывной 10.07, смена 53, ночная. Караван — Хаапалампи, Выборгское 15, «Продукты». Правки только здесь.",
    },
  ],
  ad: [
    {
      id: "a1",
      who: "Пушкина Екатерина",
      t: "13:10",
      text: "Ильин и Стеклов до 20:30. 5-6 — дублёр Кости, артиста не видим. Поезд СПб 01:05.",
    },
  ],
  loc: [
    {
      id: "l1",
      who: "Локейшн",
      t: "11:40",
      text: "Въезд игрового и техтранспорта на кладбище, первая точка.",
      link: { label: "61.654854, 30.616258", href: "https://yandex.ru/maps/?pt=30.616258,61.654854&z=16" },
    },
  ],
  cos: [
    { id: "c1", who: "Кузина Виктория", t: "12:22", text: "Костя: куртка расстёгнута, белая футболка с перцем. Марина и Лена — чёрное, красные гвоздики." },
  ],
  s54: [
    { id: "s1", who: "Пушкина Екатерина", t: "12:30", text: "Все игровые машины стоят на пятачке недалеко от могилы Семёна. Памятник с фото — реквизит." },
  ],
  s56: [
    { id: "s2", who: "Пушкина Екатерина", t: "13:12", text: "Перекрытие своими силами, автоплейбек, машина сопровождения. Указатель «Слюдянка»." },
  ],
};

export const tasksSeed: Task[] = [
  { id: "t1", dept: "Площадка", col: "блокер", title: "Костя и Игорь закрыть до 20:30", scene: "5-5", who: "Катя" },
  { id: "t2", dept: "Площадка", col: "к смене", title: "Перекрытие и автоплейбек на 5-6", scene: "5-6", who: "Илья" },
  { id: "t3", dept: "Площадка", col: "в работе", title: "Массовка сослуживцев к 15:30", scene: "5-4", who: "Оксана" },
  { id: "t4", dept: "Свет", col: "к смене", title: "Подключение 12:30, Aputure на 5-41", scene: "5-41", who: "свет" },
  { id: "t5", dept: "Локейшн", col: "в работе", title: "Въезд на кладбище, пятачок машин", scene: "5-4", who: "лок" },
  { id: "t6", dept: "Костюм", col: "к смене", title: "Футболка «Крутой перец», траур Марины/Лены", scene: "5-4", who: "Вика" },
  { id: "t7", dept: "Реквизит", col: "к смене", title: "Памятник, гвоздики, леденцы, ружьё к ночи", scene: "день", who: "Саша" },
  { id: "t8", dept: "Грим", col: "к смене", title: "Кладбище с 14:10, Александр без грима к 22:00", scene: "5-4", who: "Саша" },
];

export const depts = ["Площадка", "Свет", "Грим", "Костюм", "Локейшн", "Реквизит", "Операторы"];
