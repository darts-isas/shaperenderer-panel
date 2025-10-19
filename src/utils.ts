/**
 * Generate a unique ID for shapes
 */
export const generateUniqueId = (): string => {
  return `shape_${Math.random().toString(36).substr(2, 9)}`;
};
