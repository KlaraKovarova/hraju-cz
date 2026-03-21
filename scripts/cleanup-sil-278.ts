/**
 * SIL-278: Deactivate 84 non-facility listings + fix 19 badminton sport tags
 */

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL as string,
});
const prisma = new PrismaClient({ adapter });

const SQUASH_SPORT_ID = "yMCWy0g5FP2FPUle";
const BADMINTON_SPORT_ID = "jk8Hpc3Zm68PmcBn";

// 84 non-facility listings to deactivate
const DEACTIVATE_IDS = [
  "00HI_X9hfP8W70Ie", "C7ckbvzOIuKfmjtw", "PSFKLMn9rv5EXZTr", "G65m4jn5KjS0AMMe",
  "3uXU0BWXznhAqUR7", "prkMmK8WD4wq2Zz5", "ZaTl0jxs1ths1dBa", "UXpB1jeQ0C974bRM",
  "OwcFd-uTGtbo9Zih", "cfzT_LVjv7XsN6LX", "K3HH53JY3oBMxCVc", "tsZyIRCTf_S9ZqR8",
  "PnfFRNebDoE_sa-Z", "fDIhsThN1xSNVpOc", "mWNzsHpygRSjDtKg", "mGLUiEZ3DzSIrxhX",
  "k4Iflc29Csqsvaox", "P0y7_iV0pOH9YEXt", "69regYBcX4wSrYay", "TPOTCQ0sQ5Z2iFl_",
  "23pcLjnDHlRlcPV8", "LQsXd0Upotsm4sl8", "sb0BgHGvUyLw-p3C", "hsTnl2iDE7krh3M_",
  "0g-Bx3UP0QFsTEAg", "F5cpYFOl6Ul9s2SL", "AbXAkHG5nkU0LlQ8", "0oygi09OV-NiHFHX",
  "e4Ycg3g5AqSEx7RN", "yxWSiUgiZOhza0qZ", "ZucYT8biyRtv72K2", "iWUsCv5Z3r95SEuv",
  "SYO4YkQEMMVdWeOj", "_IqUqCpUAOfAxWNi", "xU1LfQNTkLeaTIVd", "76rtMcVAeTbh9fLQ",
  "DQ1uJrZ9eOiiNHSV", "hj8oeZdC482j5YEV", "jNGPXj_wqFjTd6PJ", "f0_D_SqdSOWApUh3",
  "XIHeW51JJ24D_6bF", "QDMfZThFiCf7T9Ac", "bIEyqEc1j10CRgzI", "mDZY9UVTOTlohZ6W",
  "Cnx6z4pM_j6cywPX", "LaZaydfCnfQyjwNo", "4eJcu9CNgLnSDdnb", "p_jqcB6W4q0yDUG8",
  "YP67C6VXEADg5kfM", "tTsMbD4z6X7pQKk5", "8-E-JLDqlJJTEmxS", "Fz8LFIWLV_FGwss_",
  "ajdrhEeK2jFidZHm", "AiykR-aHOB6TUjzf", "Tqmg6Tahc443luPJ", "NlWZzhMPXlU5FR27",
  "W5jhBUn2DYWPnRBr", "brxs3zCXz_BH_D3X", "8spkDrQZgM0Rr-8E", "l88Fbto2D9iym8IB",
  "nkMwViwFZDIJAGZb", "7C1jDsJiEoRkL7CA", "m0pRVprJxSgY0vON", "1WusFxG7cBy1FuhD",
  "5CKXGvXkZWkhn3yA", "5pcbmhdhCawgdX-J", "7dwVOvOCwAV3Af3l", "83Hrg1LPjmXTeo-t",
  "8w_je8zXjFO9RL5S", "Bb2HYS7BEGHMaCsQ", "C-NeieQQ3XB6TsP1", "CyyD85uot29VjAKq",
  "TyreyfvaEbIodE8b", "l0k-70Bsg90ve_yo", "pA8PymvqQXcaD5Pv", "ptApTYI0bQ7gH2JL",
  "v2q3u0Xy0oyRd0do", "z4TQimXHrEij3bKs", "kXH3gyKxWFChfByb", "lRyiI5GswScA7ml8",
  "yq9-mqwdcd_Y5xu8", "1cE828nM6mL8eP9f", "2Pg3RtnZocTpROxU", "KvCfru_rU5YuR9rF",
];

// Pure badminton: remove squash, add badminton
const PURE_BADMINTON_IDS = [
  "Lgwfxl1hCxlA58iY", "0ABCKAbLOx_QoJrY", "9rjsv7HvraxoxL-y", "Zfy6FHyXO4Hfzhq7",
  "-jQL2kojhv0ysti0", "hlR0JyFZ3YpSyOQ1", "2tz0lTeXLQKIrB_q", "PgVBpXG0q7hZPrX5",
  "uUgXjZWSALoor8XJ", "Sxz4bhQMhW8t9oxu", "oS3SJP8KqLeAsreh", "jFWxJMKHSwZdtdEz",
  "EqvMcTDthp-xzZ2q", "xDGWOZSIU9ZWWTcg",
];

// Both squash + badminton: keep squash, add badminton
const BOTH_SPORTS_IDS = [
  "zZ1b6FtMaQvnBj1g", // Hotel Davídek
  "0JeiHaoYt6EnxTo3", // TJ LOKOMOTIVA BEROUN
  "GlDEZ4VYfIUDyKnu", // Sportovní areály Stochov
  "pjwHM_hEFhJfCiJn", // Sportovní hala Dačice
  "_RhQIX7otDluSGb4", // Tenis & Badminton Servis
];

async function main() {
  // Part 1: Deactivate 84 non-facility listings
  console.log("=== Part 1: Deactivating non-facility listings ===");
  const deactivateResult = await prisma.facility.updateMany({
    where: { id: { in: DEACTIVATE_IDS } },
    data: { isActive: false },
  });
  console.log(`Deactivated ${deactivateResult.count} of ${DEACTIVATE_IDS.length} facilities`);

  // Part 2a: Pure badminton — remove squash tag, add badminton tag
  console.log("\n=== Part 2a: Pure badminton facilities ===");
  for (const facilityId of PURE_BADMINTON_IDS) {
    // Remove squash
    const deleted = await prisma.facilitySport.deleteMany({
      where: { facilityId, sportId: SQUASH_SPORT_ID },
    });
    // Add badminton (upsert to avoid duplicate errors)
    await prisma.facilitySport.upsert({
      where: {
        facilityId_sportId: { facilityId, sportId: BADMINTON_SPORT_ID },
      },
      create: { facilityId, sportId: BADMINTON_SPORT_ID },
      update: {},
    });
    console.log(`  ${facilityId}: removed ${deleted.count} squash, ensured badminton`);
  }

  // Part 2b: Both sports — keep squash, add badminton
  console.log("\n=== Part 2b: Both squash + badminton facilities ===");
  for (const facilityId of BOTH_SPORTS_IDS) {
    await prisma.facilitySport.upsert({
      where: {
        facilityId_sportId: { facilityId, sportId: BADMINTON_SPORT_ID },
      },
      create: { facilityId, sportId: BADMINTON_SPORT_ID },
      update: {},
    });
    console.log(`  ${facilityId}: added badminton (squash kept)`);
  }

  console.log("\n=== Done ===");
  console.log(`Deactivated: ${deactivateResult.count} facilities`);
  console.log(`Pure badminton re-tagged: ${PURE_BADMINTON_IDS.length}`);
  console.log(`Both sports added: ${BOTH_SPORTS_IDS.length}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
