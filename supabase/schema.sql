-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create documents table for RAG (학교자율시간 문서)
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding vector(768),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create index on metadata for filtering
CREATE INDEX IF NOT EXISTS idx_documents_metadata ON documents USING gin (metadata);

-- Enable Row Level Security (RLS) for documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Allow public read access to documents
CREATE POLICY "Anyone can read documents" ON documents
  FOR SELECT USING (true);

-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE documents.embedding IS NOT NULL
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

-- Create index on updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own projects
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT
  USING (true);

-- Create policy to allow users to insert their own projects
CREATE POLICY "Users can insert their own projects" ON projects
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow users to update their own projects
CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE
  USING (true);

-- Create policy to allow users to delete their own projects
CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE
  USING (true);
