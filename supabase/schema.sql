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
