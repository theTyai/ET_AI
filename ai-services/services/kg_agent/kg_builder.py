from typing import List, Dict, Any
from db.neo4j_client import get_neo4j_driver
from loguru import logger

async def create_document_node(doc_id: str, title: str, doc_type: str, plant_id: str, summary: str = "") -> str:
    """Creates/Merges a (:Document) node in Neo4j."""
    try:
        driver = get_neo4j_driver()
        query = """
        MERGE (d:Document {id: $docId})
        SET d.title = $title,
            d.docType = $docType,
            d.plant = $plantId,
            d.uploadedAt = datetime(),
            d.summary = $summary,
            d.kgNodeId = $docId
        RETURN d.id AS node_id
        """
        async with driver.session() as session:
            result = await session.run(query, {
                "docId": doc_id,
                "title": title,
                "docType": doc_type,
                "plantId": plant_id,
                "summary": summary
            })
            record = await result.single()
            return record["node_id"] if record else doc_id
    except Exception as e:
        logger.warning(f"Neo4j database is offline. Skipped Document node creation: {e}")
        return doc_id

async def build_kg_relationships(doc_id: str, entities: List[Dict[str, Any]], plant_id: str) -> Dict[str, int]:
    """Populates Neo4j with extracted entities and connects them to the parent document."""
    try:
        driver = get_neo4j_driver()
        nodes_created = 0
        rels_created = 0

        async with driver.session() as session:
            # Verify plant node exists
            await session.run(
                "MERGE (p:Plant {id: $plantId}) ON CREATE SET p.name = $plantId, p.plantId = $plantId",
                {"plantId": plant_id}
            )

            for ent in entities:
                ent_type = ent["type"]
                text = ent["text"]
                norm_text = ent.get("normalizedText") or text
                confidence = float(ent.get("confidence", 1.0))
                context = ent.get("context", "")

                # 1. Handle Node Extraction based on Ontological classification
                if ent_type == "EQUIPMENT":
                    node_query = """
                    MERGE (e:Equipment {tag: $tag})
                    SET e.plant = $plantId, e.status = 'Running'
                    MERGE (d:Document {id: $docId})
                    MERGE (e)-[r1:APPEARS_IN {confidence: $confidence, context: $context}]->(d)
                    MERGE (d)-[r2:REFERENCES {confidence: $confidence}]->(e)
                    MERGE (p:Plant {id: $plantId})
                    MERGE (e)-[r3:LOCATED_IN]->(p)
                    """
                    await session.run(node_query, {
                        "tag": norm_text,
                        "plantId": plant_id,
                        "docId": doc_id,
                        "confidence": confidence,
                        "context": context
                    })
                    nodes_created += 1
                    rels_created += 3

                elif ent_type == "INSTRUMENT":
                    node_query = """
                    MERGE (i:Instrument {tag: $tag})
                    SET i.instrumentType = $tag
                    MERGE (d:Document {id: $docId})
                    MERGE (i)-[r1:APPEARS_IN {confidence: $confidence}]->(d)
                    MERGE (d)-[r2:REFERENCES]->(i)
                    """
                    await session.run(node_query, {
                        "tag": norm_text,
                        "docId": doc_id,
                        "confidence": confidence
                    })
                    nodes_created += 1
                    rels_created += 2

                elif ent_type == "CHEMICAL":
                    node_query = """
                    MERGE (c:Chemical {name: $name})
                    MERGE (d:Document {id: $docId})
                    MERGE (c)-[r1:APPEARS_IN {confidence: $confidence}]->(d)
                    """
                    await session.run(node_query, {
                        "name": norm_text,
                        "docId": doc_id,
                        "confidence": confidence
                    })
                    nodes_created += 1
                    rels_created += 1

                elif ent_type == "REGULATION":
                    node_query = """
                    MERGE (r:Regulation {code: $code})
                    SET r.title = $code
                    MERGE (d:Document {id: $docId})
                    MERGE (d)-[rel:COMPLIES_WITH {evidenceStrength: 'Moderate'}]->(r)
                    """
                    await session.run(node_query, {
                        "code": norm_text,
                        "docId": doc_id
                    })
                    nodes_created += 1
                    rels_created += 1

                elif ent_type == "PROCEDURE":
                    node_query = """
                    MERGE (pr:Procedure {title: $title})
                    SET pr.plant = $plantId
                    MERGE (d:Document {id: $docId})
                    MERGE (d)-[r1:SUPERSEDES]->(pr)
                    """
                    await session.run(node_query, {
                        "title": norm_text,
                        "docId": doc_id,
                        "plantId": plant_id
                    })
                    nodes_created += 1
                    rels_created += 1

        logger.info(f"KG sync complete. Created {nodes_created} nodes, {rels_created} relationships in Neo4j.")
        return {"nodesCreated": nodes_created, "relationshipsCreated": rels_created}
    except Exception as e:
        logger.warning(f"Neo4j database is offline. Skipped entity relationships creation: {e}")
        return {"nodesCreated": 0, "relationshipsCreated": 0}
