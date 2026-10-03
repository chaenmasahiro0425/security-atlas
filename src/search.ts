import type {Incident} from './types';
export const normalize=(v:string)=>v.normalize('NFKC').toLocaleLowerCase('ja').trim();
export function filterIncidents(rows:Incident[],q:string,industry:string,cause:string,leak:string,month:string,sort:string){
const words=normalize(q).split(/\s+/).filter(Boolean);
return rows.filter(r=>words.every(w=>normalize([r.organization,r.title,r.summary,r.cause,r.category,r.technical,r.impact,...r.dataTypes].join(' ')).includes(w))&&(!industry||r.industry===industry)&&(!cause||r.causeStatus===cause)&&(!leak||r.leakStatus===leak)&&(!month||r.disclosedAt.startsWith(month))).sort((a,b)=>sort==='oldest'?a.disclosedAt.localeCompare(b.disclosedAt):sort==='updated'?b.sources.reduce((m,s)=>s.publishedAt>m?s.publishedAt:m,'').localeCompare(a.sources.reduce((m,s)=>s.publishedAt>m?s.publishedAt:m,'')):b.disclosedAt.localeCompare(a.disclosedAt));
}
