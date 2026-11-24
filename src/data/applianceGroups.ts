export type ApplianceGroup = "세탁·건조" | "주방가전" | "냉난방·공조" | "청소·생활";

export const APPLIANCE_GROUPS: ApplianceGroup[] = [
  "세탁·건조",
  "주방가전",
  "냉난방·공조",
  "청소·생활",
];

export const APPLIANCE_GROUP_BY_ID: Record<string, ApplianceGroup> = {
  "manual-01-drum-washer": "세탁·건조",
  "manual-02-heatpump-dryer": "세탁·건조",
  "manual-10-clothing-care-styler": "세탁·건조",

  "manual-03-four-door-refrigerator": "주방가전",
  "manual-04-dishwasher-maintenance": "주방가전",
  "manual-07-induction-cooktop": "주방가전",
  "manual-09-direct-water-purifier": "주방가전",
  "manual-12-food-waste-composter": "주방가전",
  "manual-13-steam-microwave-oven": "주방가전",
  "manual-15-capsule-coffee-machine": "주방가전",
  "manual-16-wine-cellar-maintenance": "주방가전",
  "manual-17-air-fryer-maintenance": "주방가전",
  "manual-19-induction-cooktop": "주방가전",
  "manual-21-electric-pressure-cooker": "주방가전",
  "manual-24-espresso-machine-backflush": "주방가전",
  "manual-25-disposer-drain-clean": "주방가전",
  "manual-27-electric-kettle-scale": "주방가전",
  "manual-29-toaster-crumb-tray": "주방가전",

  "manual-05-system-aircon-filter": "냉난방·공조",
  "manual-08-air-purifier-hepa": "냉난방·공조",
  "manual-14-hybrid-humidifier": "냉난방·공조",
  "manual-20-ceiling-air-conditioner": "냉난방·공조",
  "manual-23-dehumidifier-condenser": "냉난방·공조",
  "manual-28-carbon-mat-storage": "냉난방·공조",

  "manual-06-robot-vacuum-lidar": "청소·생활",
  "manual-11-cordless-stick-vacuum": "청소·생활",
  "manual-18-robot-mop-cleaner": "청소·생활",
  "manual-22-bidet-nozzle-filter": "청소·생활",
  "manual-26-soundbar-earc-sync": "청소·생활",
  "manual-30-water-softener-salt": "청소·생활",
};

export function getApplianceGroup(postId: string, title = ""): ApplianceGroup {
  if (APPLIANCE_GROUP_BY_ID[postId]) {
    return APPLIANCE_GROUP_BY_ID[postId];
  }
  const t = title.toLowerCase();
  if (t.includes("세탁") || t.includes("건조기") || t.includes("스타일러") || t.includes("의류")) {
    return "세탁·건조";
  }
  if (t.includes("에어컨") || t.includes("공기청정") || t.includes("가습") || t.includes("제습") || t.includes("매트")) {
    return "냉난방·공조";
  }
  if (t.includes("청소기") || t.includes("비데") || t.includes("사운드바") || t.includes("연수기")) {
    return "청소·생활";
  }
  return "주방가전";
}

export function isVerifiedApplianceManualId(postId?: string): boolean {
  return Boolean(postId && postId.startsWith("manual-"));
}
