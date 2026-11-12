/* Additive Cloudflare D1 adapter. No access to existing user/session tables:
   only authenticated usernames supplied by the verified Worker are accepted. */
export function createD1CommunicationsStore(db){
 if(!db?.prepare)throw Error('Cloudflare D1 binding required');
 return {
  async createMessage({audience,recipient,subject,body,author,at}){
   const r=await db.prepare("INSERT INTO safari_teacher_messages(audience,recipient,subject,body,created_at,created_by) VALUES(?,?,?,?,?,?)")
    .bind(audience,recipient,subject,body,at,author).run();
   return r.meta?.last_row_id||null;
  },
  async messagesFor(username){
   const r=await db.prepare("SELECT id,subject,body,created_at FROM safari_teacher_messages WHERE audience='all' OR (audience='child' AND recipient=?) ORDER BY id DESC LIMIT 80")
    .bind(username).all();
   return r.results||[];
  },
  async recentMessages(){
   const r=await db.prepare("SELECT id,audience,recipient,subject,created_at,created_by FROM safari_teacher_messages ORDER BY id DESC LIMIT 60").all();
   return r.results||[];
  },
  async setActivity({username,area,game,at}){
   await db.prepare("INSERT INTO safari_live_activity(username,area,game,last_seen) VALUES(?,?,?,?) ON CONFLICT(username) DO UPDATE SET area=excluded.area,game=excluded.game,last_seen=excluded.last_seen")
    .bind(username,area,game,at).run();
  },
  async liveActivity(cutoff){
   const r=await db.prepare("SELECT username,area,game,last_seen FROM safari_live_activity WHERE last_seen>=? ORDER BY last_seen DESC LIMIT 120")
    .bind(cutoff).all();
   return r.results||[];
  }
 };
}
