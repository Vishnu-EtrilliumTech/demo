// Vivid, distinct colors cycled by name hash so each contributor keeps a
// stable color across renders (avatars, chips, etc.).
const CHIP_COLORS = [
  "#E53935",
  "#8E24AA",
  "#3949AB",
  "#0277BD",
  "#00897B",
  "#558B2F",
  "#EF6C00",
  "#6D4C41",
  "#D81B60",
  "#5E35B1",
  "#00838F",
  "#2E7D32",
];

export const colorForName = (name: string): string => {
  const hash = name.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return CHIP_COLORS[hash % CHIP_COLORS.length];
};

export const initialsForName = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};
