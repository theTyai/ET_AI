from qdrant_client import QdrantClient, AsyncQdrantClient
from qdrant_client.models import Distance, VectorParams, SparseVectorParams, SparseIndexParams
from config.settings import settings
from loguru import logger

_sync_client = None
_async_client = None

def get_qdrant_client() -> QdrantClient:
    global _sync_client
    if _sync_client is None:
        _sync_client = QdrantClient(
            url=settings.qdrant_url, 
            api_key=settings.qdrant_api_key or None
        )
    return _sync_client

def get_async_qdrant_client() -> AsyncQdrantClient:
    global _async_client
    if _async_client is None:
        _async_client = AsyncQdrantClient(
            url=settings.qdrant_url, 
            api_key=settings.qdrant_api_key or None
        )
    return _async_client

def init_qdrant_collection():
    try:
        client = get_qdrant_client()
        collections = client.get_collections().collections
        exists = any(c.name == settings.qdrant_collection_name for c in collections)
        
        if not exists:
            logger.info(f"Creating Qdrant collection: {settings.qdrant_collection_name}")
            client.create_collection(
                collection_name=settings.qdrant_collection_name,
                vectors_config={
                    "dense": VectorParams(
                        size=768, # Dimension of Google text-embedding-004
                        distance=Distance.COSINE
                    )
                },
                sparse_vectors_config={
                    "bm25": SparseVectorParams(
                        index=SparseIndexParams(
                            on_disk=True
                        )
                    )
                }
            )
            # Create payload indexes for fast filtering
            indexed_fields = ["plant_id", "doc_type", "entity_types", "equipment_tags", "regulation_codes"]
            for field in indexed_fields:
                client.create_payload_index(
                    collection_name=settings.qdrant_collection_name,
                    field_name=field,
                    field_schema="keyword"
                )
            logger.info("Qdrant collection and payload indexes successfully created")
        else:
            logger.info(f"Qdrant collection {settings.qdrant_collection_name} already exists")
    except Exception as e:
        logger.error(f"Failed to initialize Qdrant collection: {e}")
