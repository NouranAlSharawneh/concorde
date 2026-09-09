/**
 * Archive chapter photographs. All files come from Wikimedia Commons and are either
 * public domain / CC0 or CC BY / CC BY-SA; the attribution line rendered under each
 * frame (author · licence) is required by the CC licences — keep it.
 *
 * Files live in /public/images/archive/<slug>.webp (max 1800px, q80) with a 900px
 * <slug>-900.webp variant for phones and a 24px <slug>-blur.webp placeholder.
 * Captions use only what the Commons description and date fields state.
 *
 * The archive wall uploads every photo to the GPU as a texture, so the 900px set is not a
 * bandwidth optimisation — it is what keeps resident VRAM near 30 MB instead of ~127 MB,
 * which is where mobile Safari starts dropping WebGL contexts.
 */
export interface Photo {
  slug: string;
  /** Main WebP, under /public. */
  src: string;
  /** 900px WebP used for the GPU texture on phones and tablets. */
  small: string;
  /** 24px-wide blurred placeholder, under /public. */
  blur: string;
  width: number;
  height: number;
  title: string;
  caption: string;
  year?: number;
  place?: string;
  author: string;
  /** e.g. "CC BY-SA 4.0" or "Public domain". */
  license: string;
  licenseUrl: string;
  /** Wikimedia Commons file page. */
  source: string;
}

const LIC = {
  pd: { license: "Public domain", licenseUrl: "https://commons.wikimedia.org/wiki/Template:PD-self" },
  cc0: { license: "CC0 1.0", licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/" },
  by2: { license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0/" },
  bysa2: { license: "CC BY-SA 2.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/" },
  bysa3: { license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/" },
  bysa4: { license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" },
} as const;

const DIR = "/images/archive";
const file = (slug: string) => ({ slug, src: `${DIR}/${slug}.webp`, small: `${DIR}/${slug}-900.webp`, blur: `${DIR}/${slug}-blur.webp` });

export const PHOTOS: readonly Photo[] = [
  {
    ...file("first-flight-toulouse-1969"),
    width: 1800,
    height: 1198,
    title: "First flight",
    caption:
      "Concorde seen from below over Toulouse-Blagnac during its first test flight, 2 March 1969. From the André Cros collection held by the city archives of Toulouse.",
    year: 1969,
    place: "Toulouse",
    author: "André Cros / Archives municipales de Toulouse",
    ...LIC.bysa4,
    source:
      "https://commons.wikimedia.org/wiki/File:02.03.69_1er_vol_de_Concorde_avec_Jacqueline_Auriol_(1969)_-_53Fi1886.jpg",
  },
  {
    ...file("schiphol-1982"),
    width: 1800,
    height: 1199,
    title: "Landing at Schiphol",
    caption:
      "Nose drooped and gear down, a British Airways Concorde in the 'British' livery lands at Amsterdam Schiphol, 14 August 1982.",
    year: 1982,
    place: "Amsterdam",
    author: "Hans van Dijk / Anefo, Nationaal Archief",
    ...LIC.cc0,
    source:
      "https://commons.wikimedia.org/wiki/File:Concorde_(vliegtuig)_weer_(tweede_keer)_even_op_Schiphol_landing_van_de_Concord,_Bestanddeelnr_932-2777.jpg",
  },
  {
    ...file("heathrow-take-off-1987"),
    width: 1625,
    height: 875,
    title: "Departing 09R",
    caption:
      "A British Airways Concorde rotates from runway 09R at Heathrow, photographed from the end of a Terminal 2 pier, 1987.",
    year: 1987,
    place: "London Heathrow",
    author: "Phillip Capper",
    ...LIC.by2,
    source: "https://commons.wikimedia.org/wiki/File:Concorde,_Heathrow_1987_-_Flickr_-_PhillipC.jpg",
  },
  {
    ...file("flight-deck-mach-2-1984"),
    width: 1800,
    height: 1152,
    title: "Mach 2, from the jump seat",
    caption:
      "The flight engineer's view of the flight deck at Mach 2 aboard G-BOAB, on a British Airways service inbound to London Heathrow, 1984.",
    year: 1984,
    place: "In flight",
    author: "Mike McBey",
    ...LIC.by2,
    source: "https://commons.wikimedia.org/wiki/File:Concorde_-_flight_engineer%27s_view_(50864542312).jpg",
  },
  {
    ...file("cockpit-g-boaa"),
    width: 1800,
    height: 1200,
    title: "Flight deck, Alpha Alpha",
    caption:
      "The cockpit of G-BOAA, the first Concorde delivered to British Airways and the aircraft that flew the first BA service to Bahrain on 21 January 1976. Preserved at the National Museum of Flight, East Fortune.",
    year: 2017,
    place: "East Fortune",
    author: "Alan Wilson",
    ...LIC.bysa2,
    source:
      "https://commons.wikimedia.org/wiki/File:Cockpit_of_Concorde_102_%E2%80%98G-BOAA%E2%80%99_(25027622917).jpg",
  },
  {
    ...file("cabin-museum-of-flight"),
    width: 1800,
    height: 1200,
    title: "The cabin",
    caption: "The passenger cabin of the Concorde preserved at the Museum of Flight near Seattle.",
    year: 2015,
    place: "Seattle",
    author: "dschwen",
    ...LIC.bysa3,
    source: "https://commons.wikimedia.org/wiki/File:Concorde_passenger_cabin.jpg",
  },
  {
    ...file("kansai-landing-1994"),
    width: 1800,
    height: 1039,
    title: "Air France at Kansai",
    caption: "An Air France Concorde over the water on approach to Kansai International Airport, Osaka, 5 September 1994.",
    year: 1994,
    place: "Osaka",
    author: "Spaceaero2",
    ...LIC.bysa3,
    source: "https://commons.wikimedia.org/wiki/File:Concorde_1_94-9-5_kix_(cropped).jpg",
  },
  {
    ...file("pepsi-livery-1996"),
    width: 1800,
    height: 1212,
    title: "The blue Concorde",
    caption: "F-BTSD at Gatwick in Pepsi's livery, 2 April 1996 — the only Concorde ever painted a colour other than white, and only for a fortnight.",
    year: 1996,
    place: "Gatwick",
    author: "Alex Rankin",
    ...LIC.by2,
    source: "https://commons.wikimedia.org/wiki/File:Air_France_Concorde_101_F-BTSD_at_Gatwick_2.4.1996.jpg",
  },
  {
    ...file("heathrow-approach-2003"),
    width: 1800,
    height: 1185,
    title: "Inbound from JFK",
    caption:
      "G-BOAD arrives at Heathrow from New York JFK on an overcast afternoon, 24 May 2003. The aircraft is now displayed at the Intrepid Museum in New York.",
    year: 2003,
    place: "London Heathrow",
    author: "Aero Icarus",
    ...LIC.bysa2,
    source:
      "https://commons.wikimedia.org/wiki/File:238cq_-_British_Airways_Concorde,_G-BOAD@LHR,24.05.2003_-_Flickr_-_Aero_Icarus.jpg",
  },
  {
    ...file("final-landing-filton-2003"),
    width: 1500,
    height: 1145,
    title: "The last landing",
    caption:
      "G-BOAF crosses the A38 on the final approach of any Concorde, landing at Filton, Bristol, on 26 November 2003.",
    year: 2003,
    place: "Filton, Bristol",
    author: "Adrian Pingstone",
    ...LIC.pd,
    source: "https://commons.wikimedia.org/wiki/File:Concorde.planview.arp.jpg",
  },
  {
    ...file("filton-preserved-g-boaf"),
    width: 1800,
    height: 1347,
    title: "Alpha Foxtrot at rest",
    caption:
      "G-BOAF preserved at Filton, the airfield from which it first flew on 20 April 1979 and where it made the last ever Concorde landing in 2003.",
    year: 2006,
    place: "Filton, Bristol",
    author: "Adrian Pingstone",
    ...LIC.pd,
    source: "https://commons.wikimedia.org/wiki/File:Concorde_at_filton_noseview_arp.jpg",
  },
];
