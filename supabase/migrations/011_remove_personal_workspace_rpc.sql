-- Personal work is modeled as a mission assigned by an operator to themselves
-- inside their existing organization. A separate PERSONAL workspace is not used.
drop function if exists public.create_workspace(text,text,text,text);
notify pgrst, 'reload schema';
