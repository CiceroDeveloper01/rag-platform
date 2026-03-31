# Database ERD

This diagram shows the logical relationships between the main database tables used by **Intelligent Automation Platform**.

The schema supports:

- user authentication
- document ingestion
- knowledge retrieval
- chat conversations
- omnichannel messaging
- execution tracking

---

```mermaid
erDiagram

users ||--o{ auth_sessions : has
users ||--o{ conversations : owns
users ||--o{ queries : performs

sources ||--o{ documents : contains

conversations ||--o{ conversation_messages : contains
conversations ||--o{ queries : related_to

omnichannel_messages ||--o{ omnichannel_executions : triggers

users {
    uuid id
    string email
    string password_hash
    string full_name
    string role
    timestamp created_at
}

auth_sessions {
    uuid id
    uuid user_id
    string token_hash
    timestamp expires_at
    timestamp created_at
}

sources {
    uuid id
    string filename
    string type
    timestamp uploaded_at
    timestamp created_at
}

documents {
    uuid id
    uuid source_id
    text content
    vector embedding
    jsonb metadata
    timestamp created_at
}

conversations {
    uuid id
    uuid user_id
    string title
    timestamp created_at
    timestamp updated_at
}

conversation_messages {
    uuid id
    uuid conversation_id
    string role
    text content
    timestamp created_at
}

queries {
    uuid id
    uuid user_id
    uuid conversation_id
    text question
    text response
    timestamp created_at
}

omnichannel_messages {
    uuid id
    string external_message_id
    uuid conversation_id
    string channel
    string direction
    string sender_id
    string sender_name
    string sender_address
    string recipient_address
    string subject
    text body
    text normalized_text
    jsonb metadata
    string status
    timestamp received_at
    timestamp processed_at
    timestamp created_at
    timestamp updated_at
}

omnichannel_executions {
    uuid id
    uuid message_id
    string trace_id
    string span_id
    string agent_name
    boolean used_rag
    text rag_query
    string model_name
    int input_tokens
    int output_tokens
    int latency_ms
    string status
    text error_message
    timestamp started_at
    timestamp finished_at
    timestamp created_at
}

omnichannel_connectors {
    uuid id
    string channel
    string name
    boolean is_enabled
    string health_status
    timestamp last_health_check_at
    jsonb config_snapshot
    timestamp created_at
    timestamp updated_at
}

omnichannel_metric_snapshots {
    uuid id
    string channel
    string period
    int total_requests
    int success_count
    int error_count
    int avg_latency_ms
    int p95_latency_ms
    timestamp created_at
}
```

`used_rag` and `rag_query` remain current field names for compatibility, even though the platform is now positioned more broadly than a retrieval-centric product.
