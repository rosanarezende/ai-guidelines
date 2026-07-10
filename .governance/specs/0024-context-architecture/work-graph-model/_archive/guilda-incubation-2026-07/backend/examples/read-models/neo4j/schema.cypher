// Neo4j read-model example. Derived only; not an authoritative SSOT.
CREATE CONSTRAINT governance_node_id IF NOT EXISTS FOR (n:GovernanceNode) REQUIRE n.id IS UNIQUE;
CREATE INDEX governance_node_type IF NOT EXISTS FOR (n:GovernanceNode) ON (n.type);
CREATE INDEX governance_node_data_hash IF NOT EXISTS FOR (n:GovernanceNode) ON (n.dataHash);
