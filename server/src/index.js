
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { connectGraph, queryGraph } = require("./graph");
const { getRecommendations } = require("./recommendations");

const app = express();
const PORT = process.env.PORT || 4000;
const USER_ID = "demo-student";

app.use(cors());
app.use(express.json());

// Read saved completed topics from FalkorDB.
async function readProgress() {
    const result = await queryGraph(
        `MATCH (m:LearningMemory {userId: '${USER_ID}'})
     RETURN m.completed`
    );

    const row = result?.[1]?.[0];
    if (!row?.[0]) return [];

    try {
        const completed =
            typeof row[0] === "string" ? JSON.parse(row[0]) : row[0];

        return Array.isArray(completed) ? completed : [];
    } catch {
        return [];
    }
}

// Learning graph.
app.get("/api/graph", async (req, res) => {
    try {
        const result = await queryGraph(
            "MATCH (a:Concept)-[:PREREQUISITE_FOR]->(b:Concept) RETURN a.name, b.name"
        );

        const rows = Array.isArray(result?.[1]) ? result[1] : [];

        const edges = rows
            .filter((row) => Array.isArray(row) && row.length >= 2)
            .map((row) => ({ from: row[0], to: row[1] }));

        const topics = [
            ...new Set(edges.flatMap((edge) => [edge.from, edge.to])),
        ];

        res.json({ topics, edges });
    } catch (error) {
        console.error("Graph error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Get saved learner progress.
app.get("/api/progress", async (req, res) => {
    try {
        const completed = await readProgress();
        res.json({ completed });
    } catch (error) {
        console.error("Progress read error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Save learner progress. Keep only ONE POST /api/progress route.
app.post("/api/progress", async (req, res) => {
    try {
        const { completed } = req.body || {};

        if (
            !Array.isArray(completed) ||
            !completed.every((topic) => typeof topic === "string")
        ) {
            return res.status(400).json({
                error: "completed must be an array of topic names",
            });
        }

        const serialized = JSON.stringify([...new Set(completed)]);
        const escaped = serialized
            .replace(/\\/g, "\\\\")
            .replace(/'/g, "\\'");

        await queryGraph(
            `MERGE (m:LearningMemory {userId: '${USER_ID}'})
       SET m.completed = '${escaped}',
           m.updatedAt = timestamp()
       RETURN m.completed`
        );

        res.json({ success: true, completed: JSON.parse(serialized) });
    } catch (error) {
        console.error("Progress save error:", error);
        res.status(500).json({ error: error.message });
    }
});

// Generate recommendations from the saved progress.
app.get("/api/recommendations", async (req, res) => {
    try {
        console.log("Recommendations API called");

        const completed = await readProgress();
        console.log("Progress from database:", completed);

        const data = await getRecommendations(completed);
        res.json(data);
    } catch (error) {
        console.error("Recommendations error:", error);
        res.status(500).json({ error: error.message });
    }


});

// Start the API after connecting to FalkorDB.
async function startServer() {
    try {
        await connectGraph();

        app.listen(PORT, "127.0.0.1", () => {
            console.log(`StudyGraph AI API running at http://127.0.0.1:${PORT}`);
        });
    } catch (error) {
        console.error("Could not start StudyGraph AI API:", error);
        process.exit(1);
    }
}

startServer();
