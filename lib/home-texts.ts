export interface HomeTextField {
  key: string;
  label: string;
  defaultValue: string;
  multiline?: boolean;
  helpText?: string;
  allowEmpty?: boolean;
}

export interface HomeTextSection {
  title: string;
  fields: readonly HomeTextField[];
}

/** Every editable homepage text, grouped by section in the order they appear on the page. */
export const HOME_TEXT_SECTIONS = [
  {
    title: "Nyitókép (fejléc alatti nagy kép)",
    fields: [
      { key: "hero.title", label: "Főcím", defaultValue: "Emlékek," },
      { key: "hero.subtitle", label: "Alcím", defaultValue: "amiket jó újra és újra megnézni." },
      {
        key: "hero.description",
        label: "Leírás",
        defaultValue: "Családi és portré fotózás természetes, időtálló képekkel.",
        multiline: true,
      },
      { key: "hero.primaryButton", label: "Első gomb felirata", defaultValue: "Családi fotózás" },
      { key: "hero.portraitButton", label: "Második gomb felirata", defaultValue: "Portré fotózás" },
      { key: "hero.noteLine1", label: "Jobb felső írott szöveg – 1. sor", defaultValue: "Több" },
      { key: "hero.noteLine2", label: "Jobb felső írott szöveg – 2. sor", defaultValue: "mint fotózás..." },
      { key: "hero.noteLine3", label: "Jobb felső írott szöveg – 3. sor", defaultValue: "Érzés." },
    ],
  },
  {
    title: "Információs sáv / fül (Hero kép alatt)",
    fields: [
      {
        key: "infoBanner.badge",
        label: "Címke / Kategória (opcionális kis kiemelő címke)",
        defaultValue: "",
        helpText: "Pl.: FONTOS INFORMÁCIÓ, KARÁCSONYI FOTÓZÁS, vagy hagyd üresen.",
        allowEmpty: true,
      },
      {
        key: "infoBanner.title",
        label: "Főcím (opcionális)",
        defaultValue: "",
        helpText: "Kiemelt vastag címsor az információs sávban.",
        allowEmpty: true,
      },
      {
        key: "infoBanner.content",
        label: "Információs szöveg (ha üres, a sáv nem jelenik meg)",
        defaultValue: "",
        multiline: true,
        helpText:
          "Formázási lehetőségek: **félkövér**, *dőlt*, {red}kiemelt piros szöveg{/red}, {gold}arany kiemelés{/gold}, {badge}CÍMKE{/badge}, [Gomb vagy link szövege](/idopontfoglalas). Új sorokat is használhatsz.",
        allowEmpty: true,
      },
      {
        key: "infoBanner.buttonText",
        label: "Gomb felirata (opcionális)",
        defaultValue: "",
        helpText: "Pl.: Időpontfoglalás vagy Részletek megtekintése",
        allowEmpty: true,
      },
      {
        key: "infoBanner.buttonUrl",
        label: "Gomb hivatkozása (URL vagy belső oldal)",
        defaultValue: "",
        helpText: "Pl.: /idopontfoglalas vagy /szezonalis-fotozas vagy https://...",
        allowEmpty: true,
      },
    ],
  },
  {
    title: "„Miben segíthetek?” szolgáltatás-kártyák",
    fields: [
      { key: "services.title", label: "Cím", defaultValue: "Miben segíthetek?" },
      { key: "services.subtitle", label: "Alcím", defaultValue: "Válassz a szolgáltatásaim közül!" },
      { key: "services.cta", label: "Kártya gomb felirata", defaultValue: "Tovább" },
      { key: "services.service-csaladi.title", label: "1. kártya címe", defaultValue: "Családi fotózás" },
      {
        key: "services.service-csaladi.description",
        label: "1. kártya szövege",
        defaultValue: "Őszinte pillanatok. Közös emlékek. Rólatok.",
        multiline: true,
      },
      { key: "services.service-portre.title", label: "2. kártya címe", defaultValue: "Portré fotózás" },
      {
        key: "services.service-portre.description",
        label: "2. kártya szövege",
        defaultValue: "Természetes portrék, amelyek megmutatják az egyéniségedet.",
        multiline: true,
      },
      {
        key: "services.service-bolcsode-ovoda.title",
        label: "3. kártya címe",
        defaultValue: "Bölcsődei & óvodai fotózás",
      },
      {
        key: "services.service-bolcsode-ovoda.description",
        label: "3. kártya szövege",
        defaultValue: "Gyermekfotózás szeretettel, türelemmel és természetesen.",
        multiline: true,
      },
      { key: "services.service-iskola.title", label: "4. kártya címe", defaultValue: "Iskolai fotózás" },
      {
        key: "services.service-iskola.description",
        label: "4. kártya szövege",
        defaultValue: "Igényes portrék és közösségi képek.",
        multiline: true,
      },
      { key: "services.service-szezonalis.title", label: "5. kártya címe", defaultValue: "Szezonális fotózás" },
      {
        key: "services.service-szezonalis.description",
        label: "5. kártya szövege",
        defaultValue: "Karácsony, Anyák napja és különleges alkalmak.",
        multiline: true,
      },
    ],
  },
  {
    title: "„Hogyan működik?” lépések",
    fields: [
      { key: "steps.eyebrow", label: "Felső kis felirat", defaultValue: "Folyamat" },
      { key: "steps.title", label: "Cím", defaultValue: "Hogyan működik?" },
      { key: "steps.1.title", label: "1. lépés címe", defaultValue: "Válassz szolgáltatást" },
      { key: "steps.1.description", label: "1. lépés szövege", defaultValue: "Családi vagy intézményi fotózás." },
      { key: "steps.2.title", label: "2. lépés címe", defaultValue: "Foglalj időpontot" },
      {
        key: "steps.2.description",
        label: "2. lépés szövege",
        defaultValue: "Nézd meg a szabad időpontokat, és válassz egyet.",
      },
      { key: "steps.3.title", label: "3. lépés címe", defaultValue: "Kapj visszaigazolást" },
      {
        key: "steps.3.description",
        label: "3. lépés szövege",
        defaultValue: "E-mailben értesítünk a foglalás állapotáról.",
      },
      { key: "steps.4.title", label: "4. lépés címe", defaultValue: "Élvezd a fotózást" },
      {
        key: "steps.4.description",
        label: "4. lépés szövege",
        defaultValue: "A megbeszélt időpontban várunk szeretettel.",
      },
    ],
  },
  {
    title: "Bemutatkozás (Rólam rész)",
    fields: [
      { key: "about.eyebrow", label: "Felső kis felirat", defaultValue: "ZsaNa Photo" },
      { key: "about.title", label: "Cím", defaultValue: "A fotós, aki a pillanatot keresi" },
      {
        key: "about.body",
        label: "Bemutatkozó szöveg",
        defaultValue:
          "Zsani vagyok, a ZsaNa Photo megálmodója. Számomra a fotózás nem csak munka, hanem szenvedély. Szeretem a természetes pillanatokat, az őszinte mosolyokat és azokat a kis részleteket, amik igazán különlegessé teszik az emlékeket.",
        multiline: true,
      },
      { key: "about.button", label: "Gomb felirata", defaultValue: "Több rólam »" },
      { key: "about.quote", label: "Idézet", defaultValue: "„A legszebb képek a szívvel készülnek.”", multiline: true },
      { key: "about.signature", label: "Aláírás", defaultValue: "Zsani" },
    ],
  },
  {
    title: "Galéria rész és jellemzők",
    fields: [
      { key: "gallery.eyebrow", label: "Felső kis felirat", defaultValue: "Galéria" },
      { key: "gallery.title", label: "Cím", defaultValue: "Nézz körül a galériában" },
      { key: "gallery.link", label: "Link felirata", defaultValue: "Galéria megnyitása →" },
      { key: "gallery.feature1", label: "1. jellemző", defaultValue: "Természetes, őszinte képek" },
      { key: "gallery.feature2", label: "2. jellemző", defaultValue: "Gyermekbarát légkör" },
      { key: "gallery.feature3", label: "3. jellemző", defaultValue: "Minőségi utómunka" },
      { key: "gallery.feature4", label: "4. jellemző", defaultValue: "Egyedi, időtálló emlékek" },
    ],
  },
] as const satisfies readonly HomeTextSection[];

export type HomeTextKey = (typeof HOME_TEXT_SECTIONS)[number]["fields"][number]["key"];
export type HomeTexts = Record<HomeTextKey, string>;

export const HOME_TEXT_FIELDS: readonly HomeTextField[] = HOME_TEXT_SECTIONS.flatMap(
  (section): readonly HomeTextField[] => section.fields,
);

export const HOME_TEXT_MAX_LENGTH = 1000;

export function isHomeTextKey(value: string): value is HomeTextKey {
  return HOME_TEXT_FIELDS.some((field) => field.key === value);
}

export function getDefaultHomeTexts(): HomeTexts {
  return Object.fromEntries(HOME_TEXT_FIELDS.map((field) => [field.key, field.defaultValue])) as HomeTexts;
}

/** Returns the edited title/description of a homepage service card, falling back to its definition. */
export function getServiceCardTexts(
  texts: HomeTexts,
  card: { key: string; title: string; description: string },
): { title: string; description: string } {
  const byKey = texts as Record<string, string | undefined>;
  return {
    title: byKey[`services.${card.key}.title`] ?? card.title,
    description: byKey[`services.${card.key}.description`] ?? card.description,
  };
}
