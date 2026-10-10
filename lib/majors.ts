export const MAJORS = [
  {
    code: "PPLG",
    name: "Pengembangan Perangkat Lunak dan Game",
    description:
      "Mempelajari pengembangan perangkat lunak, pemrograman, dan pembuatan game.",
  },
  {
    code: "DKV",
    name: "Desain Komunikasi Visual",
    description:
      "Mempelajari komunikasi visual melalui desain grafis, ilustrasi, dan media digital.",
  },
  {
    code: "TJKT",
    name: "Teknik Jaringan Komputer dan Komunikasi",
    description:
      "Mempelajari perancangan, instalasi, dan pemeliharaan jaringan serta sistem telekomunikasi.",
  },
  {
    code: "BDR",
    name: "Bisnis dan Digitalisasi Ritel",
    description:
      "Mempelajari pengelolaan bisnis ritel dan pemasaran dengan dukungan teknologi digital.",
  },
  {
    code: "MPLB",
    name: "Manajemen Perkantoran dan Layanan Bisnis",
    description:
      "Mempelajari administrasi perkantoran, pengelolaan layanan, dan komunikasi bisnis.",
  },
  {
    code: "PH",
    name: "Perhotelan",
    description:
      "Mempelajari layanan hotel dan pengelolaan operasional perhotelan.",
  },
] as const;

export function majorFullName(code: string): string {
  return MAJORS.find((major) => major.code === code)?.name ?? code;
}