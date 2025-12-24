// lib/calculateSpineWidth.ts

export const calculateSpineWidth = (pageCount: number): number => {
  const MIN_WIDTH = 12; 
  const MAX_WIDTH = 80; 
  const PAGES_PER_PIXEL = 8;
  
  const calculatedWidth = pageCount / PAGES_PER_PIXEL;
  
  // Clamp between min and max
  return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, calculatedWidth));
};