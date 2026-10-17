
const { queryGraph } = require("./graph");

async function getRecommendations(completed = []) {
    if (!Array.isArray(completed)) {
        throw new TypeError("completed must be an array");
    }

    const result = await queryGraph(
        "MATCH (a:Concept)-[:PREREQUISITE_FOR]->(b:Concept) RETURN a.name, b.name"
    );
    const rows = Array.isArray(result?.[1]) ? result[1] : [];
    const edges = rows
        .filter((row) => Array.isArray(row) && row.length >= 2)
        .map(([from, to]) => ({ from, to }))
        .filter((edge) => typeof edge.from === "string" &&
            typeof edge.to === "string");

    const topics = [...new Set(edges.flatMap(({ from, to }) => [from, to]))];
    const completedSet = new Set(completed);
    const incomplete = topics.filter((topic) => !completedSet.has(topic));

    // Recommend topics whose prerequisites are already completed.
    let candidates = incomplete
        .map((topic) => {
            const prerequisites = edges
                .filter((edge) => edge.to === topic)
                .map((edge) => edge.from);

            const satisfied = prerequisites.filter((p) =>
                completedSet.has(p)
            );

            return {
                topic,
                prerequisites,
                satisfied,
                score: prerequisites.length
                    ? Math.round((satisfied.length / prerequisites.length) * 100)
                    : 100,
            };
        })
        .filter((item) =>
            item.prerequisites.length === 0 ||
            item.satisfied.length === item.prerequisites.length
        );

    // If no topic is currently unlocked, suggest incomplete starting topics.
    if (candidates.length === 0 && incomplete.length > 0) {
        candidates = incomplete
            .filter((topic) => !edges.some((edge) => edge.to === topic))
            .map((topic) => ({
                topic,
                prerequisites: [],
                satisfied: [],
                score: 100,
            }));
    }

    candidates.sort((a, b) => b.score - a.score);

    const recommendations = candidates.map((item) => ({
        topic: item.topic,
        score: item.score,
        reason: item.prerequisites.length
            ? `You completed ${item.satisfied.join(", ")}. The prerequisites for ${item.topic} are complete.`
            : `Start with ${item.topic} to build your learning foundation.`,
        path: [...item.satisfied, item.topic],
    }));

    return {
        recommendations,
        explanation: recommendations.length
            ? "Recommended topics are ranked using your completed progress and prerequisite relationships."
            : "All available topics are complete. Great work!",
        completedCount: completedSet.size,
        totalTopics: topics.length,
        progressPercent: topics.length
            ? Math.round((topics.filter((topic) => completedSet.has(topic)).length / topics.length) * 100)
            : 0,
    };
}

module.exports = { getRecommendations };



