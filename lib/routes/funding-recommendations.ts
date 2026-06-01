export function fundingRecommendationRoutes(id: string | number) {
  const base = `/research/funding-recommendations/${id}`;

  return {
    list: "/research/funding-recommendations",
    detail: base,
    awardGeneration: `${base}/award-generation`,
    agreement: `${base}/agreement`,
  };
}
