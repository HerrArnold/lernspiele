/* Cloudflare D1 storage for classroom-service.mjs.
   Existing users/assignments tables are deliberately NOT guessed.
   Supply trusted lookup functions from the existing Worker. */
export function createD1ClassroomStore(db,{getAssignmentDefinitions,getChildAssignments,studentExists}){
 if(!db?.prepare||!getAssignmentDefinitions||!getChildAssignments||!studentExists)
  throw Error('D1 and existing Worker lookup functions required');
 return {
  async loadMode(){
   const row=await db.prepare("SELECT kind,subject,required_assignment_ids_json,expires_at FROM safari_classroom_mode WHERE scope='class'").first();
   if(!row)return null;
   let ids=[];try{ids=JSON.parse(row.required_assignment_ids_json||'[]')}catch(_){ids=[]}
   return {kind:row.kind,subject:row.subject,required_assignment_ids:ids,expires_at:row.expires_at};
  },
  async saveMode(mode,adminUsername){
   const stamp=new Date().toISOString();
   await db.prepare(`INSERT INTO safari_classroom_mode
    (scope,kind,subject,required_assignment_ids_json,expires_at,modified_by,modified_at)
    VALUES ('class',?,?,?,?,?,?)
    ON CONFLICT(scope) DO UPDATE SET kind=excluded.kind,subject=excluded.subject,
    required_assignment_ids_json=excluded.required_assignment_ids_json,
    expires_at=excluded.expires_at,modified_by=excluded.modified_by,modified_at=excluded.modified_at`)
    .bind(mode.kind,mode.subject,JSON.stringify(mode.required_assignment_ids),mode.expires_at,adminUsername,stamp).run();
  },
  assignmentDefinitions:ids=>getAssignmentDefinitions(ids),
  childAssignments:name=>getChildAssignments(name),
  studentExists:name=>studentExists(name),
  async verifiedIds(username){
   const rows=await db.prepare('SELECT assignment_id FROM safari_assignment_verification WHERE username=?').bind(username).all();
   return (rows.results||[]).map(x=>x.assignment_id);
  },
  async setVerification({username,assignmentId,verified,adminUsername}){
   const stamp=new Date().toISOString();
   const statements=[];
   if(verified){
    statements.push(db.prepare(`INSERT INTO safari_assignment_verification
      (username,assignment_id,verified_at,verified_by) VALUES (?,?,?,?)
      ON CONFLICT(username,assignment_id) DO UPDATE SET verified_at=excluded.verified_at,
      verified_by=excluded.verified_by`).bind(username,assignmentId,stamp,adminUsername));
   }else{
    statements.push(db.prepare('DELETE FROM safari_assignment_verification WHERE username=? AND assignment_id=?').bind(username,assignmentId));
   }
   statements.push(db.prepare(`INSERT INTO safari_assignment_verification_audit
    (username,assignment_id,verified,actor,changed_at) VALUES (?,?,?,?,?)`)
    .bind(username,assignmentId,verified?1:0,adminUsername,stamp));
   await db.batch(statements);
  }
 };
}
