/**
 * Canonical North–South railway station list (fallback when the
 * station-suggestions API is unavailable). Single source of truth shared by
 * the home page, search page, ticket catalogue and the 2D route map.
 */
export const STATIONS = [
  { code: "HAN", name: "Hà Nội", km: "0 km" },
  { code: "VIH", name: "Vinh", km: "319 km" },
  { code: "HUE", name: "Huế", km: "688 km" },
  { code: "DAD", name: "Đà Nẵng", km: "791 km" },
  { code: "NTR", name: "Nha Trang", km: "1.315 km" },
  { code: "SGN", name: "Sài Gòn", km: "1.726 km" },
] as const;
