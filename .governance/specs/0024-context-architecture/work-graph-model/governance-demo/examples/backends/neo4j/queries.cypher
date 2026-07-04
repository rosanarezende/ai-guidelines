// Neo4j example queries for governance navigation.

// 1. Contract impact: which intents, repos and consumers surround a contract?
MATCH path = (i:GovernanceNode)-[:CHANGES|CONSUMES|COORDINATES*1..3]-(c:CONTRACT {id: $contractId})
RETURN path;

// 2. Repo accountability: central work pieces acknowledged by a repo.
MATCH (repo:REPO {id: $repoId})<-[:IN_REPO]-(work:WORK)<-[:PIECE]-(intent:INTENT)
OPTIONAL MATCH (repo)-[:PUBLISHES_WORK]->(ack:REPO_WORK_ACK)-[:ACKNOWLEDGES_WORK]->(work)
RETURN intent.id, work.id, ack.id, ack.data;

// 3. Dashboard path: objective to outcome through target and intent.
MATCH path = (objective:OBJECTIVE)-[:HAS_TARGET]->(target:TARGET)<-[:CONTRIBUTES_TO]-(outcome:OUTCOME)<-[:EMITS]-(intent:INTENT)
RETURN path;
