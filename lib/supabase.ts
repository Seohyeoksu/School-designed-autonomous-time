import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function saveProject(userId: string, projectData: any) {
  const { data, error } = await supabase
    .from('projects')
    .insert([
      {
        user_id: userId,
        project_data: projectData,
        updated_at: new Date().toISOString(),
      },
    ])
    .select()

  if (error) throw error
  return data
}

export async function updateProject(projectId: string, projectData: any) {
  const { data, error } = await supabase
    .from('projects')
    .update({
      project_data: projectData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .select()

  if (error) throw error
  return data
}

export async function getProjects(userId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data
}

export async function deleteProject(projectId: string) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) throw error
}
