/* Additive Cloudflare D1 adapter. No access to existing user/session tables:
   only authenticated usernames supplied by the verified Worker are accepted. */
export function createD1CommunicationsStore(db){
 if(!db?.prepare)throw Error('Cloudflare D1 binding required');
 return {
  async createMessage({audience,recipient,kind='message',subject,body,author,at}){
   const r=await db.prepare("INSERT INTO safari_teacher_messages(audience,recipient,kind,subject,body,created_at,created_by) VALUES(?,?,?,?,?,?,?)")
    .bind(audience,recipient,kind,subject,body,at,author).run();
   return r.meta?.last_row_id||null;
  },
  async messagesFor(username){
   const r=await db.prepare("SELECT m.id,m.subject,m.body,m.kind,m.created_at,r.read_at FROM safari_teacher_messages m LEFT JOIN safari_message_reads r ON r.message_id=m.id AND r.username=? WHERE m.audience='all' OR (m.audience='child' AND m.recipient=?) ORDER BY m.created_at DESC,m.id DESC LIMIT 100")
    .bind(username,username).all();
   return r.results||[];
  },
  async recentMessages(){
   const r=await db.prepare("SELECT id,audience,recipient,kind,subject,created_at,created_by FROM safari_teacher_messages ORDER BY id DESC LIMIT 60").all();
   return r.results||[];
  },
  async markRead(username,id,at){
   const exists=await db.prepare("SELECT id FROM safari_teacher_messages WHERE id=? AND (audience='all' OR (audience='child' AND recipient=?)) LIMIT 1").bind(id,username).first();
   if(!exists)return false;
   await db.prepare('INSERT INTO safari_message_reads(message_id,username,read_at) VALUES(?,?,?) ON CONFLICT(message_id,username) DO NOTHING').bind(id,username,at).run();
   return true;
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
