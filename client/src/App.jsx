

import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = "http://localhost:4000";

const icons = {
  Variables: "▤",
  Functions: "</>",
  Loops: "↻",
  Recursion: "◉",
};

export default function App() {
  const [edges, setEdges] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [status, setStatus] = useState("Connecting...");
  const [search, setSearch] = useState("");

  // Load graph, progress and recommendations.
  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const [graphResponse, progressResponse] =
          await Promise.all([
            fetch(`${API}/api/graph`),
            fetch(`${API}/api/progress`),
          ]);

        if (!graphResponse.ok) {
          throw new Error("Could not load graph data.");
        }

        const graphData = await graphResponse.json();
        let saved = [];

        if (progressResponse.ok) {
          const progressData = await progressResponse.json();

          if (Array.isArray(progressData.completed)) {
            saved = progressData.completed;
          }
        } else {
          try {
            const localSaved = JSON.parse(
              localStorage.getItem("studygraph-progress") || "[]"
            );

            if (Array.isArray(localSaved)) saved = localSaved;
          } catch {
            saved = [];
          }
        }

        const recResponse = await fetch(
          `${API}/api/recommendations`
        );

        if (!recResponse.ok) {
          throw new Error("Could not load recommendations.");
        }

        const recData = await recResponse.json();

        if (cancelled) return;

        setEdges(
          Array.isArray(graphData.edges) ? graphData.edges : []
        );

        setCompleted(saved);

        setRecommendations(
          Array.isArray(recData.recommendations)
            ? recData.recommendations
            : []
        );

        localStorage.setItem(
          "studygraph-progress",
          JSON.stringify(saved)
        );

        setStatus("FalkorDB connected");
      } catch (error) {
        console.error("Dashboard load failed:", error);

        if (!cancelled) {
          setStatus("Backend connection failed");

          try {
            const localSaved = JSON.parse(
              localStorage.getItem("studygraph-progress") || "[]"
            );

            setCompleted(
              Array.isArray(localSaved) ? localSaved : []
            );
          } catch {
            setCompleted([]);
          }
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  // Get unique concepts from graph connections.
  const topics = useMemo(
    () => [
      ...new Set(
        edges.flatMap((edge) => [edge.from, edge.to])
      ),
    ],
    [edges]
  );

  // Search: case-insensitive, partial matches and extra spaces.
  const visibleTopics = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return topics;

    return topics.filter((topic) =>
      String(topic).toLowerCase().includes(query)
    );
  }, [topics, search]);

  const completedCount = topics.filter((topic) =>
    completed.includes(topic)
  ).length;

  const progress = topics.length
    ? Math.round((completedCount / topics.length) * 100)
    : 0;

  // Select the next recommended incomplete topic.
  const nextTopic = useMemo(() => {
    const recommended = recommendations.find((item) => {
      const topic =
        typeof item === "string" ? item : item?.topic;

      return (
        typeof topic === "string" &&
        topics.includes(topic) &&
        !completed.includes(topic)
      );
    });

    if (recommended) {
      return typeof recommended === "string"
        ? recommended
        : recommended.topic;
    }

    const availableEdge = edges.find(
      (edge) =>
        completed.includes(edge.from) &&
        !completed.includes(edge.to)
    );

    if (availableEdge) return availableEdge.to;

    return (
      topics.find((topic) => !completed.includes(topic)) ||
      "All caught up!"
    );
  }, [edges, recommendations, completed, topics]);

  const recommendationDetails = recommendations.find(
    (item) =>
      typeof item === "object" &&
      item !== null &&
      item.topic === nextTopic
  );

  // Update progress and refresh recommendations.
  async function toggle(topic) {
    const updated = completed.includes(topic)
      ? completed.filter((item) => item !== topic)
      : [...completed, topic];

    setCompleted(updated);

    localStorage.setItem(
      "studygraph-progress",
      JSON.stringify(updated)
    );

    try {
      const response = await fetch(`${API}/api/progress`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed: updated }),
      });

      if (!response.ok) {
        throw new Error("Progress update failed.");
      }

      const recResponse = await fetch(
        `${API}/api/recommendations`
      );

      if (!recResponse.ok) {
        throw new Error("Could not refresh recommendations.");
      }

      const recData = await recResponse.json();

      setRecommendations(
        Array.isArray(recData.recommendations)
          ? recData.recommendations
          : []
      );

      setStatus("FalkorDB connected");
    } catch (error) {
      console.error("Progress update failed:", error);
      setStatus("Progress saved locally; server sync failed");
    }
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-mark">✳</span>
          <div>
            <b>
              StudyGraph <em>AI</em>
            </b>
            <small>Learn smarter. Grow faster.</small>
          </div>
        </div>

        <nav>
          <a className="active" href="#dashboard">
            ⌂ <span>Dashboard</span>
          </a>
          <a href="#path">
            ▤ <span>Learning Path</span>
          </a>
          <a href="#graph">
            ♧ <span>Graph View</span>
          </a>
          <a href="#progress">
            ◴ <span>Progress</span>
          </a>
        </nav>

        <div className="sidebar-note">
          <span>✦</span>
          <b>Powered by FalkorDB</b>
          <p>
            Your knowledge, connected. Recommendations you can
            understand.
          </p>
        </div>
      </aside>

      <main className="main" id="dashboard">
        <header className="topbar">
          <input
            type="search"
            aria-label="Search concepts"
            placeholder="⌕  Search concepts..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          {search.trim() && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              Clear
            </button>
          )}

          <div className="profile">
            <span>S</span> Student
          </div>
        </header>

        <div className="content">
          <section className="welcome">
            <div>
              <div className="eyebrow">
                YOUR PERSONAL LEARNING SPACE
              </div>

              <h1>
                Welcome back, <span>Student!</span> 👋
              </h1>

              <p>
                Your learning journey is powered by connected
                knowledge.
                <br />
                Discover what to learn next and why it matters.
              </p>

              <div className="connection">
                <i /> {status}
              </div>
            </div>

            <div className="mini-graph" aria-label="Concept connections">
              <div className="mini-node n1">Variables</div>
              <div className="mini-node n2">Functions</div>
              <div className="brain">✳</div>
              <div className="mini-node n3">Loops</div>
              <div className="mini-node n4">Recursion</div>

              <svg viewBox="0 0 300 160" preserveAspectRatio="none">
                <path d="M55 32 L145 78 L240 32 M55 125 L145 78 L240 125" />
              </svg>
            </div>
          </section>

          <section className="stats" id="progress">
            <article className="stat blue">
              <div className="stat-icon">▤</div>
              <span>Total concepts</span>
              <strong>{topics.length}</strong>
              <small>From your learning graph</small>
            </article>

            <article className="stat green">
              <div className="stat-icon">✓</div>
              <span>Completed</span>
              <strong>{completedCount}</strong>
              <small>Every step counts</small>
            </article>

            <article className="stat purple">
              <div className="stat-icon">↗</div>
              <span>Your progress</span>
              <strong>{progress}%</strong>
              <div className="progress-track">
                <i style={{ width: `${progress}%` }} />
              </div>
            </article>

            <article className="stat amber">
              <div className="stat-icon">✧</div>
              <span>Next recommended</span>
              <strong className="next-name">{nextTopic}</strong>
              <small>Based on graph connections</small>
            </article>
          </section>

          <section className="panel graph-panel" id="graph">
            <div className="section-heading">
              <div>
                <span className="heading-icon">♧</span>
                <div>
                  <h2>Learning graph</h2>
                  <p>See how your concepts connect</p>
                </div>
              </div>

              <span className="tag">LIVE GRAPH DATA</span>
            </div>

            {edges.length ? (
              <div className="edge-list">
                {edges.map((edge, index) => (
                  <div
                    className="edge-row"
                    key={`${edge.from}-${edge.to}-${index}`}
                  >
                    <span className="concept-chip">
                      {icons[edge.from] || "◇"} {edge.from}
                    </span>

                    <span className="edge-line">
                      <i />›
                    </span>

                    <span className="concept-chip">
                      {icons[edge.to] || "◇"} {edge.to}
                    </span>

                    <span className="edge-label">
                      prerequisite for
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty">
                Graph connections will appear here when the backend
                returns data.
              </p>
            )}
          </section>

          <section className="panel path-panel" id="path">
            <div className="section-heading">
              <div>
                <span className="heading-icon">▣</span>
                <div>
                  <h2>Your learning path</h2>
                  <p>
                    Mark a concept complete to update your progress
                  </p>
                </div>
              </div>

              <span className="tag">
                {completedCount} / {topics.length} DONE
              </span>
            </div>

            <div className="topic-grid">
              {visibleTopics.map((topic) => (
                <button
                  type="button"
                  key={topic}
                  className={`topic-card ${completed.includes(topic) ? "is-done" : ""
                    }`}
                  onClick={() => toggle(topic)}
                >
                  <span className="topic-symbol">
                    {completed.includes(topic)
                      ? "✓"
                      : icons[topic] || "◇"}
                  </span>

                  <span>
                    <b>{topic}</b>
                  </span>
                </button>
              ))}

              {!visibleTopics.length && (
                <p className="empty">
                  {topics.length
                    ? `No concepts found for "${search.trim()}".`
                    : "Waiting for concepts from the backend..."}
                </p>
              )}
            </div>
          </section>

          <footer>
            StudyGraph AI <span>•</span> Explainable learning,
            powered by FalkorDB
          </footer>
        </div>
      </main>

      <aside className="rightbar">
        <section className="recommend-card">
          <div className="recommend-title">
            ✦ &nbsp; Next recommended
          </div>

          <div className="recommend-body">
            <div className="recommend-icon">⌘</div>

            <div>
              <h2>{nextTopic}</h2>
              <span className="recommend-badge">
                Graph-based suggestion
              </span>
            </div>

            <p>
              {recommendationDetails?.reason ||
                (nextTopic === "All caught up!"
                  ? "You have completed all concepts currently in your graph."
                  : `Your graph identifies ${nextTopic} as a useful next topic in your learning path.`)}
            </p>

            <button
              type="button"
              onClick={() =>
                document
                  .getElementById("path")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Explore learning path <span>→</span>
            </button>
          </div>
        </section>

        <section className="panel why-card">
          <h3>✳ &nbsp; Why this recommendation?</h3>
          <p>
            Suggestions follow the prerequisite relationships stored
            in FalkorDB. Mark concepts complete to help choose the
            next available topic.
          </p>
          <div className="why-foot">
            ⌁ &nbsp; Traceable graph relationships
          </div>
        </section>

        <section className="panel insights">
          <h3>♧ &nbsp; Graph insights</h3>

          {edges.length ? (
            edges.map((edge, index) => (
              <div
                className="insight-row"
                key={`${edge.from}-${edge.to}-${index}`}
              >
                <span>{edge.from}</span>
                <b>→</b>
                <span>{edge.to}</span>
              </div>
            ))
          ) : (
            <p className="empty">Waiting for graph data…</p>
          )}
        </section>
      </aside>
    </div>
  );
}
