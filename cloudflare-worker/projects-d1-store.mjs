/* Server-only D1 repository. Existing D1 schema remains untouched. */
export function createD1ProjectStore(db){
 if(!db?.prepare)throw Error('Cloudflare D1 is required');
 return {
  async listProjects(){const r=await db.prepare("SELECT id,event_date,title,caption,image_data FROM safari_projects ORDER BY event_date DESC,id DESC LIMIT 24").all();return r.results||[];},
  async addProject({date,title,caption,image,by,at}){const r=await db.prepare("INSERT INTO safari_projects(event_date,title,caption,image_data,published_by,published_at) VALUES(?,?,?,?,?,?)").bind(date,title,caption,image,by,at).run();return r.meta?.last_row_id||null;},
  async deleteProject(id){const r=await db.prepare('DELETE FROM safari_projects WHERE id=?').bind(id).run();return Number(r.meta?.changes||0)>0;}
 };
}
