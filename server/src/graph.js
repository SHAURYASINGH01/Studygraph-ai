
const { createClient } = require("redis");

const client = createClient({
    url: process.env.FALKORDB_URL || "redis://127.0.0.1:6379",
});

client.on("error", (error) => {
    console.error("FalkorDB connection error:", error.message);
});

async function connectGraph() {
    if (!client.isOpen) {
        await client.connect();
    }
}

async function queryGraph(cypher) {
    await connectGraph();

    return client.sendCommand([
        "GRAPH.QUERY",
        "StudyGraph",
        cypher,
    ]);
}

module.exports = {
    connectGraph,
    queryGraph,
};
