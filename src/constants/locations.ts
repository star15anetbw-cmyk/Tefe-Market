/**
 * Coordinates and mapping for neighborhoods in Tefé, Amazonas.
 * These are approximate centers for each neighborhood.
 */

export const TEFE_CENTER: [number, number] = [-3.355, -64.711];

export const NEIGHBORHOOD_COORDS: Record<string, [number, number]> = {
  'Centro': [-3.357, -64.708],
  'Abial': [-3.348, -64.715],
  'Juruá': [-3.365, -64.718],
  'Fonte Boa': [-3.372, -64.705],
  'Santa Tereza': [-3.350, -64.695],
  'Jerusalém': [-3.385, -64.720],
  'Vila Antônia': [-3.342, -64.725],
  'Bairro de Fátima': [-3.352, -64.702],
  'São Francisco': [-3.360, -64.715],
  'Santo Antônio': [-3.345, -64.700]
};

export const getRandomCoordInNeighborhood = (neighborhood: string): [number, number] => {
  const base = NEIGHBORHOOD_COORDS[neighborhood] || TEFE_CENTER;
  // Add a small random offset so markers don't overlap perfectly
  const latOffset = (Math.random() - 0.5) * 0.005;
  const lngOffset = (Math.random() - 0.5) * 0.005;
  return [base[0] + latOffset, base[1] + lngOffset];
};
