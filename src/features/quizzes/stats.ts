import { gradeSession } from './grading';
import type { Session } from './types';

export function topicRates(sessions: readonly Session[]) {
	const byTopic = new Map<string, { correct: number; total: number }>();
	for (const q of sessions.flatMap((s) => s.questions)) {
		const entry = byTopic.get(q.question.topic) ?? { correct: 0, total: 0 };
		entry.total += 1;
		if (q.selectedOptionId === q.question.correctOptionId) entry.correct += 1;
		byTopic.set(q.question.topic, entry);
	}
	return [...byTopic]
		.map(([topic, { correct, total }]) => ({
			topic,
			total,
			rate: Math.round((correct / total) * 100)
		}))
		.sort((a, b) => a.rate - b.rate);
}

export function summarize(sessions: readonly Session[]) {
	const grades = sessions.filter((s) => s.submittedAt).map(gradeSession);
	const sum = grades.reduce((total, g) => total + g.percentage, 0);

	return {
		quizCount: grades.length,
		averageScore: grades.length ? sum / grades.length : null,
		latestScore: grades[0]?.percentage ?? null,
		weakTopics: topicRates(sessions.filter((s) => s.submittedAt)).slice(0, 3)
	};
}
