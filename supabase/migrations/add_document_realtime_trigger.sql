-- Enable Realtime for the document table (only if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'knowledge' 
    AND tablename = 'document'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE knowledge.document;
    RAISE NOTICE 'Added knowledge.document to supabase_realtime publication';
  ELSE
    RAISE NOTICE 'knowledge.document is already in supabase_realtime publication';
  END IF;
END $$;

-- Function to broadcast document changes to Supabase Realtime
CREATE OR REPLACE FUNCTION knowledge.document_changes_broadcast()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Broadcast changes to realtime subscribers
  -- This will trigger the postgres_changes event in Supabase Realtime
  
  -- Broadcast to all document listeners
  PERFORM pg_notify(
    'document:all',
    json_build_object(
      'event', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'new', row_to_json(NEW),
      'old', row_to_json(OLD)
    )::text
  );
  
  -- Also broadcast to specific knowledge base channel
  -- Channel name pattern: document:kb:{knowledge_base_id}
  IF (NEW.knowledge_base_id IS NOT NULL OR OLD.knowledge_base_id IS NOT NULL) THEN
    PERFORM pg_notify(
      'document:kb:' || coalesce(NEW.knowledge_base_id, OLD.knowledge_base_id)::text,
      json_build_object(
        'event', TG_OP,
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'new', row_to_json(NEW),
        'old', row_to_json(OLD),
        'knowledge_base_id', coalesce(NEW.knowledge_base_id, OLD.knowledge_base_id)
      )::text
    );
  END IF;
  
  -- Return the appropriate value based on the operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger for INSERT operations
DROP TRIGGER IF EXISTS document_changes_broadcast_insert ON knowledge.document;
CREATE TRIGGER document_changes_broadcast_insert
  AFTER INSERT ON knowledge.document
  FOR EACH ROW
  EXECUTE FUNCTION knowledge.document_changes_broadcast();

-- Create trigger for UPDATE operations
DROP TRIGGER IF EXISTS document_changes_broadcast_update ON knowledge.document;
CREATE TRIGGER document_changes_broadcast_update
  AFTER UPDATE ON knowledge.document
  FOR EACH ROW
  EXECUTE FUNCTION knowledge.document_changes_broadcast();

-- Create trigger for DELETE operations
DROP TRIGGER IF EXISTS document_changes_broadcast_delete ON knowledge.document;
CREATE TRIGGER document_changes_broadcast_delete
  AFTER DELETE ON knowledge.document
  FOR EACH ROW
  EXECUTE FUNCTION knowledge.document_changes_broadcast();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA knowledge TO anon, authenticated;
GRANT SELECT ON knowledge.document TO anon, authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION knowledge.document_changes_broadcast() IS 
  'Broadcasts document changes to Supabase Realtime subscribers. 
   Notifies both general document:all channel and specific document:kb:{id} channels.';
