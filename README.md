# StudyGraph AI

**A graph-powered personalized learning recommendation system built with FalkorDB.**

## Overview

<b> Agent Memory and Co-ordination </b>

StudyGraph AI helps learners discover what to study next by using topic prerequisites and learning progress. FalkorDB stores the relationships between learning concepts, while the application uses those relationships to recommend topics.

## Problem Statement

Learners often struggle to decide what to learn next and which concepts they should understand first. StudyGraph AI represents learning topics as a graph to make prerequisites and next steps easier to understand.

## Features

- Learning topics connected through prerequisite relationships.
- Track completed topics.
- Recommend eligible next topics based on learning progress.
- Graph-based learning context powered by FalkorDB.
- React frontend and Node.js/Express backend.

## Technology Stack

- Frontend: React and Vite
- Backend: Node.js and Express
- Graph database: FalkorDB
- Language: JavaScript

## Graph Model

**Nodes:** Learning topics.

**Relationships:** Prerequisite relationships between topics.

Example:

- Variables → Functions
- Functions → Recursion
- Loops → Recursion

These relationships represent the learning order used by the recommendation logic.

## Run Locally

### Prerequisites

- Node.js
- Docker Desktop
- FalkorDB running locally

### Start the backend

Open a terminal in the project directory:

```bash
cd server
npm install
node src/index.js
```

### Start the frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL shown by Vite, usually `http://localhost:5173`.

Ensure FalkorDB is running and the backend's database connection is configured correctly.

## Project Status

StudyGraph AI is a prototype. Recommendations currently use graph relationships and learning progress; they should not be described as LLM-generated unless an AI model is actually integrated.

## Hackathon

Built for Graph Hacks featuring FalkorDB.

## AI Assistance Disclosure

AI coding assistance was used during development.

## Future Improvements

- More learning topics and prerequisite relationships.
- Improved personalized recommendations.
- User accounts and persistent learning profiles.
- Deployment with a hosted FalkorDB instance.

## Example Cypher Queries

StudyGraph AI uses FalkorDB to store learning topics and their prerequisite relationships.

### View learning topics and prerequisites

```cypher
MATCH (a)-[r]->(b)
RETURN a, r, b
```

This query retrieves connected nodes and relationships from the `StudyGraph` graph.

### Example learning path

```text
Variables -> Functions -> Recursion
Loops -> Recursion
```

These relationships represent prerequisite dependencies used by the learning recommendation system.

### Graph Query Execution

The Node.js backend connects to FalkorDB through the Redis client and executes Cypher queries using the `GRAPH.QUERY` command on the `StudyGraph` graph.











