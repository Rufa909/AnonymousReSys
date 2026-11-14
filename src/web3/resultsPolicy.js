// This controls application display; blockchain data itself remains public.
export function canViewResults(role, evaluationOpen) {
  return role !== 'student' || !evaluationOpen;
}

export function hideCourseResults(course) {
  return { ...course, totalScore: 0n, reviewCount: 0n, score: null };
}
