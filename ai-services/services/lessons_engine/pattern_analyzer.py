import json
from typing import List, Dict, Any
from google import generativeai as genai
from db.mongo_client import MongoClientManager
from db.neo4j_client import get_neo4j_driver
from services.rag.hybrid_search import hybrid_search
from config.settings import settings
from loguru import logger
from bson.objectid import ObjectId

genai.configure(api_key=settings.google_ai_api_key)

async def analyze_incident_pattern(
    event_id: str, 
    event_type: str, 
    description: str, 
    equipment_tags: List[str], 
    plant_id: str
) -> Dict[str, Any]:
    """Scans the historical incident logs using embeddings and KG to isolate systemic failure loops."""
    db = MongoClientManager.get_db()

    # 1. Search vector database for similar past incidents
    logger.info(f"Lessons Engine: Searching similar events for: '{description[:50]}'")
    fused_hits = await hybrid_search(
        description,
        plant_id,
        top_k=5,
        filters={"doc_types": ["IncidentReport", "WorkOrder"]}
    )

    # 2. Fetch details of those incidents from MongoDB
    similar_event_details = []
    similar_event_ids = []
    
    for hit in fused_hits:
        doc_id = hit["document_id"]
        # Skip if matches the current event document
        if doc_id == event_id:
            continue
            
        similar_event_ids.append(doc_id)
        similar_event_details.append(
            f"Event Ref: {doc_id} | Preview: {hit['content_preview']}"
        )

    # 3. Query Neo4j for other failures on same equipment tags
    kg_failures = []
    if equipment_tags:
        driver = get_neo4j_driver()
        async with driver.session() as session:
            query = """
            MATCH (e:Equipment)-[rel:LOCATED_IN]->(p:Plant)
            WHERE e.tag IN $tags AND p.id = $plantId
            MATCH (wo:WorkOrder)-[:APPLIED_TO]->(e)
            RETURN wo.woNumber AS woNum, wo.title AS title, e.tag AS tag
            LIMIT 5
            """
            result = await session.run(query, {"tags": equipment_tags, "plantId": plant_id})
            async for record in result:
                kg_failures.append(
                    f"Prior WO on {record['tag']}: {record['woNum']} - {record['title']}"
                )

    # If no similar events, return empty pattern
    if not similar_event_details and not kg_failures:
        return {"patterns": [], "alerts": [], "similarEventIds": []}

    # 4. Prompt Gemini to discover if a systemic pattern exists
    similar_events_str = "\n".join(similar_event_details) if similar_event_details else "None"
    kg_failures_str = "\n".join(kg_failures) if kg_failures else "None"

    prompt = f"""You are an industrial failure pattern miner. Analyze these maintenance and incident events.
State if there is a systemic issue (e.g. repeated seal failures on pump P-101, repeated electrical trips in Unit-3, near-misses during gas purging).
Identify a systemic pattern ONLY if there are at least 2 similar historical events.

CURRENT EVENT DESCRIPTION:
{description}
Equipment tags involved: {equipment_tags}

HISTORICAL SEMANTICALLY MATCHED EVENTS:
{similar_events_str}

GRAPH FAILURE HISTORY FOR INVOLVED EQUIPMENT:
{kg_failures_str}

Respond in this exact JSON format. Do not wrap in markdown quotes.
{{
  "systemicPatternFound": true/false,
  "patternDescription": "clear summary of the systemic issue (null if false)",
  "urgency": "one of [Low, Medium, High, Critical]",
  "matchedPastEventIds": ["id1", "id2"],
  "recommendedPreventiveAction": "specific action for plant managers",
  "affectedEquipment": ["tag1", "tag2"]
}}
"""
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        pattern_res = json.loads(response.text.strip())
        
        patterns = []
        alerts = []
        
        if pattern_res.get("systemicPatternFound", False):
            pattern_desc = pattern_res.get("patternDescription")
            patterns.append(pattern_desc)
            
            alerts.append({
                "alertId": str(ObjectId()),
                "pattern": pattern_desc,
                "urgency": pattern_res.get("urgency", "Medium"),
                "affectedEquipment": pattern_res.get("affectedEquipment", []),
                "message": f"AI Alert: {pattern_desc}. Action: {pattern_res.get('recommendedPreventiveAction')}"
            })
            
            logger.info(f"Lessons Engine: Systemic pattern discovered: {pattern_desc}")
            
            # Save lessons learned recommendation into MongoDB
            lessons_log = {
                "plant": ObjectId(plant_id),
                "title": f"Pattern Alert: {pattern_desc[:100]}",
                "description": pattern_desc,
                "equipmentTags": pattern_res.get("affectedEquipment", []),
                "failureModes": [pattern_res.get("patternDescription")],
                "recommendations": [pattern_res.get("recommendedPreventiveAction")],
                "createdAt": datetime_now()
            }
            await db.lessonslearned.insert_one(lessons_log)

        return {
            "patterns": patterns,
            "alerts": alerts,
            "similarEventIds": similar_event_ids
        }
    except Exception as e:
        logger.error(f"Pattern analyzer failed: {e}")
        return {"patterns": [], "alerts": [], "similarEventIds": []}

def datetime_now():
    from datetime import datetime
    return datetime.utcnow()
