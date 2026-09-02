export const peptideThemes = [
  { id: "clinical-grid", name: "Clinical Grid", description: "Bright laboratory surfaces, precise blue rules, and documentation-first merchandising.", colors: ["#073B66", "#18A5E4", "#F2F8FC", "#10243A"] },
  { id: "midnight-lab", name: "Midnight Lab", description: "A premium dark laboratory with electric cyan details and high-contrast product cards.", colors: ["#081B2D", "#2AD4D9", "#102A3D", "#EAFBFF"] },
  { id: "molecule-editorial", name: "Molecule Editorial", description: "Warm scientific publishing inspired by compound monographs and archival research notes.", colors: ["#362B25", "#C46E3C", "#F5F0E8", "#2A2521"] },
  { id: "cold-chain", name: "Cold Chain", description: "Crisp glacier tones, restrained typography, and fulfillment-led trust signals.", colors: ["#174E63", "#6CC7D8", "#EDF9FB", "#16313A"] },
  { id: "biofuture", name: "BioFuture", description: "Forward-looking violet and lime accents for a bold next-generation peptide brand.", colors: ["#3B2473", "#B5E45B", "#F5F1FF", "#241747"] },
] as const;
export type PeptideThemeId = typeof peptideThemes[number]["id"];
