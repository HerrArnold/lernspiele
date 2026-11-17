/* Server-only D1 repository. Existing D1 schema remains untouched. */
export function createD1ProjectStore(db){
 if(!db?.prepare)throw Error('Cloudflare D1 is required');
 return {
  async listProjects(){const r=await db.prepare("SELECT p.id,p.event_date,p.title,p.caption,p.image_data,(SELECT count(*) FROM safari_project_photos ph WHERE ph.project_id=p.id) AS photo_count FROM safari_projects p ORDER BY p.event_date ASC,p.id ASC LIMIT 80").all();return r.results||[];},
  async projectExists(id){
   return !!await db.prepare('SELECT id FROM safari_projects WHERE id=? LIMIT 1').bind(id).first();
  },
  async listPhotos(projectId){
   const r=await db.prepare('SELECT id,image_data FROM safari_project_photos WHERE project_id=? ORDER BY position ASC,id ASC LIMIT 8').bind(projectId).all();
   return r.results||[];
  },
  async photoCount(projectId){
   const row=await db.prepare('SELECT count(*) AS total FROM safari_project_photos WHERE project_id=?').bind(projectId).first();
   return Number(row?.total||0);
  },
  async addPhoto({projectId,image,by,at}){
   const result=await db.prepare(
    'INSERT INTO safari_project_photos(project_id,image_data,position,published_by,published_at) SELECT ?,?,COALESCE((SELECT MAX(position)+1 FROM safari_project_photos WHERE project_id=?),1),?,? WHERE (SELECT COUNT(*) FROM safari_project_photos WHERE project_id=?) < 8'
   ).bind(projectId,image,projectId,by,at,projectId).run();
   if(!result.meta?.changes)throw Error('Maximum additional images reached');
   return result.meta?.last_row_id||null;
  },
  async deletePhoto(id){
   const r=await db.prepare('DELETE FROM safari_project_photos WHERE id=?').bind(id).run();
   return Number(r.meta?.changes||0)>0;
  },
  async addProject({date,title,caption,image,by,at}){const r=await db.prepare("INSERT INTO safari_projects(event_date,title,caption,image_data,published_by,published_at) VALUES(?,?,?,?,?,?)").bind(date,title,caption,image,by,at).run();return r.meta?.last_row_id||null;},
  async deleteProject(id){await db.prepare('DELETE FROM safari_project_photos WHERE project_id=?').bind(id).run();const r=await db.prepare('DELETE FROM safari_projects WHERE id=?').bind(id).run();return Number(r.meta?.changes||0)>0;}
 };
}
