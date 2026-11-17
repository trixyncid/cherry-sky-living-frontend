/**
 * Country calling codes (ITU E.164). Names come from `Intl.DisplayNames` so
 * they follow the UI language. Where several countries share a code, the
 * first one listed is used when reading a stored number back (e.g. +1 → US).
 */
export type CountryDial = { iso: string; dial: string };

export const DEFAULT_COUNTRY_ISO = "ID";

// Indonesia's neighbours and common origins first; the picker sorts by name.
const RAW =
  "ID62 US1 CA1 RU7 KZ7 EG20 ZA27 GR30 NL31 BE32 FR33 ES34 HU36 IT39 RO40 CH41 AT43 GB44 DK45 SE46 NO47 PL48 DE49 PE51 MX52 CU53 AR54 BR55 CL56 CO57 VE58 MY60 AU61 PH63 NZ64 SG65 TH66 JP81 KR82 VN84 CN86 TR90 IN91 PK92 AF93 LK94 MM95 IR98 SS211 MA212 DZ213 TN216 LY218 GM220 SN221 MR222 ML223 GN224 CI225 BF226 NE227 TG228 BJ229 MU230 LR231 SL232 GH233 NG234 TD235 CF236 CM237 CV238 ST239 GQ240 GA241 CG242 CD243 AO244 GW245 SC248 SD249 RW250 ET251 SO252 DJ253 KE254 TZ255 UG256 BI257 MZ258 ZM260 MG261 RE262 ZW263 NA264 MW265 LS266 BW267 SZ268 KM269 SH290 ER291 AW297 FO298 GL299 GI350 PT351 LU352 IE353 IS354 AL355 MT356 CY357 FI358 BG359 LT370 LV371 EE372 MD373 AM374 BY375 AD376 MC377 SM378 UA380 RS381 ME382 XK383 HR385 SI386 BA387 MK389 CZ420 SK421 LI423 FK500 BZ501 GT502 SV503 HN504 NI505 CR506 PA507 PM508 HT509 GP590 BO591 GY592 EC593 GF594 PY595 MQ596 SR597 UY598 CW599 TL670 NF672 BN673 NR674 PG675 TO676 SB677 VU678 FJ679 PW680 WF681 CK682 NU683 WS685 KI686 NC687 TV688 PF689 TK690 FM691 MH692 KP850 HK852 MO853 KH855 LA856 BD880 TW886 MV960 LB961 JO962 SY963 IQ964 KW965 SA966 YE967 OM968 PS970 AE971 IL972 BH973 QA974 BT975 MN976 NP977 TJ992 TM993 AZ994 GE995 KG996 UZ998 BS1242 BB1246 AI1264 AG1268 VG1284 VI1340 KY1345 BM1441 GD1473 TC1649 MS1664 MP1670 GU1671 AS1684 SX1721 LC1758 DM1767 VC1784 PR1787 DO1809 TT1868 KN1869 JM1876";

export const COUNTRIES: CountryDial[] = RAW.split(" ").map((entry) => ({
  iso: entry.slice(0, 2),
  dial: entry.slice(2),
}));

const BY_ISO = new Map(COUNTRIES.map((c) => [c.iso, c]));

export function countryByIso(iso: string): CountryDial {
  return BY_ISO.get(iso) ?? (BY_ISO.get(DEFAULT_COUNTRY_ISO) as CountryDial);
}

/** 🇮🇩 from "ID". */
export function flagEmoji(iso: string): string {
  return String.fromCodePoint(
    ...[...iso.toUpperCase()].map((ch) => 0x1f1a5 + ch.charCodeAt(0)),
  );
}

const nameCache = new Map<string, Intl.DisplayNames | null>();
export function countryName(iso: string, locale: string): string {
  if (!nameCache.has(locale)) {
    try {
      nameCache.set(
        locale,
        new Intl.DisplayNames([locale], { type: "region" }),
      );
    } catch {
      nameCache.set(locale, null);
    }
  }
  return nameCache.get(locale)?.of(iso) ?? iso;
}

/**
 * Split "+905321234567" into its country and national digits, using the
 * longest matching calling code. `preferIso` keeps e.g. Canada selected for
 * +1 numbers when that's what the user picked.
 */
export function splitE164(
  e164: string,
  preferIso?: string,
): { country: CountryDial; national: string } | null {
  if (!e164.startsWith("+")) return null;
  const digits = e164.slice(1).replace(/\D/g, "");
  for (let len = 4; len >= 1; len -= 1) {
    const dial = digits.slice(0, len);
    const matches = COUNTRIES.filter((c) => c.dial === dial);
    if (matches.length) {
      const country =
        matches.find((c) => c.iso === preferIso) ?? (matches[0] as CountryDial);
      return { country, national: digits.slice(len) };
    }
  }
  return null;
}
