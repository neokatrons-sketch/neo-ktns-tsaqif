export type SizeCode = "S" | "M" | "L" | "XL" | "XXL";
export type PackageCode =
  | "one-point"
  | "one-point-back"
  | "two-points"
  | "two-points-back"
  | "three-points"
  | "three-points-back"
  | "four-points"
  | "five-points-full"
  | "back-only";

export type PlacementCode =
  | "left-chest"
  | "right-chest"
  | "left-sleeve"
  | "right-sleeve"
  | "back";

export type PlacementPreset = {
  id: string;
  label: string;
  positions: readonly PlacementCode[];
};

export type EmbroideryPackage = {
  code: PackageCode;
  name: string;
  nameEn: string;
  summary: string;
  explanation: string;
  maxSize: string;
  placementRule: string;
  points: number;
  back: boolean;
  presets: readonly PlacementPreset[];
};

export const product = {
  id: "premium-polo",
  slug: "premium-polo",
  name: "Premium Short Sleeve Polo",
  nameId: "Polo Lengan Pendek Premium",
  material: "Premium Piqué 24s",
  weight: "200–220 gsm",
  feel: "Medium–tebal, structured feel",
  leadTime: "Minimum 15 hari",
  production: "Preorder custom production",
};

export const colors = [
  { slug: "white", name: "Putih", nameEn: "White", hex: "#F4F2EC" },
  { slug: "black", name: "Hitam", nameEn: "Black", hex: "#151617" },
  { slug: "maroon", name: "Maroon", nameEn: "Maroon", hex: "#641F2A" },
  { slug: "chili-red", name: "Merah Cabe", nameEn: "Chili Red", hex: "#B12C2B" },
  { slug: "navy", name: "Navy", nameEn: "Navy", hex: "#152A43" },
  { slug: "army-green", name: "Hijau Army", nameEn: "Army Green", hex: "#4C5742" },
  { slug: "dark-gray", name: "Abu Tua", nameEn: "Dark Gray", hex: "#4C5052" },
] as const;

export type ColorSlug = (typeof colors)[number]["slug"];

export const sizes = [
  { code: "S", length: 66, chest: 92, public: true },
  { code: "M", length: 69, chest: 98, public: true },
  { code: "L", length: 72, chest: 104, public: true },
  { code: "XL", length: 75, chest: 110, public: true },
  { code: "XXL", length: null, chest: null, public: false },
] as const;

export const placements: ReadonlyArray<{ code: PlacementCode; label: string; shortLabel: string; max: string }> = [
  { code: "left-chest", label: "Dada kiri", shortLabel: "DKi", max: "7 × 7 cm" },
  { code: "right-chest", label: "Dada kanan", shortLabel: "DKa", max: "7 × 7 cm" },
  { code: "left-sleeve", label: "Lengan kiri", shortLabel: "LKi", max: "7 × 7 cm" },
  { code: "right-sleeve", label: "Lengan kanan", shortLabel: "LKa", max: "7 × 7 cm" },
  { code: "back", label: "Belakang", shortLabel: "B", max: "26 × 14 cm" },
];

export const embroideryPackages: readonly EmbroideryPackage[] = [
  {
    code: "one-point",
    name: "1 Titik",
    nameEn: "1 Point",
    summary: "Satu bordir kecil di dada atau lengan.",
    explanation: "Pilihan paling ringkas untuk logo utama atau identitas kecil.",
    maxSize: "1 area kecil · maks. 7 × 7 cm",
    placementRule: "Pilih salah satu dari 4 posisi kecil",
    points: 1,
    back: false,
    presets: [
      { id: "left-chest", label: "Dada kiri", positions: ["left-chest"] },
      { id: "right-chest", label: "Dada kanan", positions: ["right-chest"] },
      { id: "left-sleeve", label: "Lengan kiri", positions: ["left-sleeve"] },
      { id: "right-sleeve", label: "Lengan kanan", positions: ["right-sleeve"] },
    ],
  },
  {
    code: "one-point-back",
    name: "1 Titik + Belakang",
    nameEn: "1 Point + Back",
    summary: "Satu posisi kecil dengan bordir punggung.",
    explanation: "Identitas depan yang minimal dengan ruang komunikasi lebih besar di belakang.",
    maxSize: "Kecil 7 × 7 cm · belakang 26 × 14 cm",
    placementRule: "Pilih 1 posisi kecil + punggung",
    points: 2,
    back: true,
    presets: [
      { id: "left-chest-back", label: "Dada kiri + punggung", positions: ["left-chest", "back"] },
      { id: "right-chest-back", label: "Dada kanan + punggung", positions: ["right-chest", "back"] },
      { id: "left-sleeve-back", label: "Lengan kiri + punggung", positions: ["left-sleeve", "back"] },
      { id: "right-sleeve-back", label: "Lengan kanan + punggung", positions: ["right-sleeve", "back"] },
    ],
  },
  {
    code: "two-points",
    name: "2 Titik",
    nameEn: "2 Points",
    summary: "Satu lengan dan satu dada berlawanan.",
    explanation: "Komposisi seimbang untuk logo organisasi dan identitas tambahan.",
    maxSize: "2 area kecil · masing-masing 7 × 7 cm",
    placementRule: "Lengan kiri + dada kanan, atau sebaliknya",
    points: 2,
    back: false,
    presets: [
      { id: "left-sleeve-right-chest", label: "Lengan kiri + dada kanan", positions: ["left-sleeve", "right-chest"] },
      { id: "right-sleeve-left-chest", label: "Lengan kanan + dada kiri", positions: ["right-sleeve", "left-chest"] },
    ],
  },
  {
    code: "two-points-back",
    name: "2 Titik + Belakang",
    nameEn: "2 Points + Back",
    summary: "Satu lengan, satu dada, dan punggung.",
    explanation: "Paket lengkap untuk struktur identitas depan dan informasi besar di belakang.",
    maxSize: "Kecil 7 × 7 cm · belakang 26 × 14 cm",
    placementRule: "Pasangan lengan–dada berlawanan + punggung",
    points: 3,
    back: true,
    presets: [
      { id: "left-sleeve-right-chest-back", label: "Lengan kiri + dada kanan + punggung", positions: ["left-sleeve", "right-chest", "back"] },
      { id: "right-sleeve-left-chest-back", label: "Lengan kanan + dada kiri + punggung", positions: ["right-sleeve", "left-chest", "back"] },
    ],
  },
  {
    code: "three-points",
    name: "3 Titik",
    nameEn: "3 Points",
    summary: "Satu lengan dan kedua sisi dada.",
    explanation: "Memberi ruang untuk logo, nama unit, dan identitas pendamping.",
    maxSize: "3 area kecil · masing-masing 7 × 7 cm",
    placementRule: "Pilih 1 lengan + dada kiri + dada kanan",
    points: 3,
    back: false,
    presets: [
      { id: "left-sleeve-both-chest", label: "Lengan kiri + kedua dada", positions: ["left-sleeve", "left-chest", "right-chest"] },
      { id: "right-sleeve-both-chest", label: "Lengan kanan + kedua dada", positions: ["right-sleeve", "left-chest", "right-chest"] },
    ],
  },
  {
    code: "three-points-back",
    name: "3 Titik + Belakang",
    nameEn: "3 Points + Back",
    summary: "Tiga posisi kecil dengan bordir punggung.",
    explanation: "Konfigurasi organisasi yang kaya tanpa kehilangan komposisi rapi.",
    maxSize: "Kecil 7 × 7 cm · belakang 26 × 14 cm",
    placementRule: "1 lengan + kedua dada + punggung",
    points: 4,
    back: true,
    presets: [
      { id: "left-sleeve-both-chest-back", label: "Lengan kiri + kedua dada + punggung", positions: ["left-sleeve", "left-chest", "right-chest", "back"] },
      { id: "right-sleeve-both-chest-back", label: "Lengan kanan + kedua dada + punggung", positions: ["right-sleeve", "left-chest", "right-chest", "back"] },
    ],
  },
  {
    code: "four-points",
    name: "4 Titik",
    nameEn: "4 Points",
    summary: "Kedua lengan dan kedua sisi dada.",
    explanation: "Seluruh area kecil terisi untuk identitas tim yang lebih lengkap.",
    maxSize: "4 area kecil · masing-masing 7 × 7 cm",
    placementRule: "Kedua lengan + kedua dada",
    points: 4,
    back: false,
    presets: [
      { id: "all-small", label: "Semua posisi kecil", positions: ["left-sleeve", "right-sleeve", "left-chest", "right-chest"] },
    ],
  },
  {
    code: "five-points-full",
    name: "5 Titik (Full)",
    nameEn: "5 Points Full",
    summary: "Kedua lengan, kedua dada, dan punggung.",
    explanation: "Paket full placement untuk kebutuhan identitas paling lengkap.",
    maxSize: "Kecil 7 × 7 cm · belakang 26 × 14 cm",
    placementRule: "Semua posisi bordir",
    points: 5,
    back: true,
    presets: [
      { id: "full", label: "Semua posisi + punggung", positions: ["left-sleeve", "right-sleeve", "left-chest", "right-chest", "back"] },
    ],
  },
  {
    code: "back-only",
    name: "Belakang Aja",
    nameEn: "Back Only",
    summary: "Satu bordir besar khusus punggung.",
    explanation: "Fokus pada identitas atau artwork utama di bagian belakang.",
    maxSize: "Punggung · maks. 26 × 14 cm",
    placementRule: "Punggung saja",
    points: 1,
    back: true,
    presets: [{ id: "back", label: "Punggung", positions: ["back"] }],
  },
];

export function getEmbroideryPackage(code: PackageCode) {
  return embroideryPackages.find((item) => item.code === code)!;
}

export function getPlacementLabel(code: PlacementCode) {
  return placements.find((placement) => placement.code === code)?.label ?? code;
}

const placementOrder: readonly PlacementCode[] = [
  "left-chest",
  "right-chest",
  "left-sleeve",
  "right-sleeve",
  "back",
];

function normalisePlacements(value: readonly PlacementCode[]) {
  const selected = new Set(value);
  return placementOrder.filter((code) => selected.has(code));
}

function samePlacementSet(left: readonly PlacementCode[], right: readonly PlacementCode[]) {
  const normalisedLeft = normalisePlacements(left);
  const normalisedRight = normalisePlacements(right);
  return normalisedLeft.length === normalisedRight.length && normalisedLeft.every((code, index) => code === normalisedRight[index]);
}

export function inferEmbroiderySelection(
  selectedPlacements: readonly PlacementCode[],
  availablePackages: readonly EmbroideryPackage[] = embroideryPackages,
) {
  for (const embroideryPackage of availablePackages) {
    const preset = embroideryPackage.presets.find((option) => samePlacementSet(option.positions, selectedPlacements));
    if (preset) {
      return {
        packageCode: embroideryPackage.code,
        presetId: preset.id,
        positions: normalisePlacements(preset.positions),
      };
    }
  }

  return null;
}

export const faqItems = [
  { question: "Apakah bisa pesan satuan?", answer: "Bisa. Neo KTNS tidak menerapkan minimum order, sehingga kamu dapat memesan satuan maupun sekaligus untuk satu kelompok." },
  { question: "Berapa lama pengerjaannya?", answer: "Waktu produksi minimum 15 hari setelah desain dan pembayaran dikonfirmasi. Jumlah besar atau revisi besar dapat memengaruhi jadwal." },
  { question: "Apakah ada garansi jika produk cacat?", answer: "Ada. Produk custom tidak dapat dikembalikan, kecuali terdapat cacat atau kesalahan produksi dari pihak kami." },
  { question: "Berapa ukuran maksimal bordir?", answer: "Posisi dada dan lengan maksimal 7 × 7 cm. Bordir punggung maksimal 26 × 14 cm." },
];
