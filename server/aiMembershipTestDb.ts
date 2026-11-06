// In-memory Drizzle-shaped fixture for membership unit tests only.
import { getTableName } from "drizzle-orm";
import { MySqlDialect } from "drizzle-orm/mysql-core";
const dialect = new MySqlDialect();
export class MembershipTestDb {
  tables: Record<string, any[]> = {};
  clear() { this.tables = {}; }
  rows(table: any) { return this.tables[getTableName(table)] ||= []; }
  matches(row: any, condition?: any) {
    if (!condition) return true;
    const query = dialect.sqlToQuery(condition);
    let param = 0;
    const comparisons = Array.from(query.sql.matchAll(/`[^`]+`\.`([^`]+)`\s*(=|>|<|is null)\s*(\?)?/g));
    return comparisons.every(match => {
      const current = row[match[1]];
      if (match[2] === "is null") return current == null;
      const value = query.params[param++];
      const left = current instanceof Date ? current.getTime() : current;
      const right: any = current instanceof Date ? new Date(String(value)).getTime() : value;
      if (match[2] === "=") return left === right;
      return match[2] === ">" ? left > right : left < right;
    });
  }
  select(fields?: any) {
    let table: any, condition: any, limit = Infinity, joined: any;
    const run = () => this.rows(table).filter(row => this.matches(row, condition)).slice(0, limit).map(row => joined && fields?.member ? { member: this.rows(joined).find(member => member.id === row.memberId) } : { ...row });
    const query: any = {
      from: (value: any) => { table = value; return query; },
      innerJoin: (value: any) => { joined = value; return query; },
      where: (value: any) => { condition = value; return query; },
      limit: (value: number) => { limit = value; return query; },
      for: () => query,
      then: (resolve: any, reject: any) => Promise.resolve().then(run).then(resolve, reject),
    };
    return query;
  }
  insert(table: any) {
    let values: any;
    const run = (set?: any) => {
      const rows = this.rows(table);
      const key = getTableName(table) === "ai_members" ? "email" : ("hash" in values ? "hash" : "slot" in values ? "slot" : "id");
      const old = rows.find(row => row[key] === values[key]);
      if (old) { if (!set) throw new Error("Duplicate key"); Object.assign(old, set); }
      else rows.push({ id: values.id ?? rows.length + 1, welcomeSentAt: null, welcomeLeaseAt: null, usedAt: null, cancelAtPeriodEnd: false, ...values });
      return [{ affectedRows: 1 }];
    };
    const query: any = {
      values: (value: any) => { values = value; return query; },
      onDuplicateKeyUpdate: ({ set }: any) => Promise.resolve().then(() => run(set)),
      then: (resolve: any, reject: any) => Promise.resolve().then(() => run()).then(resolve, reject),
    };
    return query;
  }
  update(table: any) {
    let set: any;
    const query = { set: (value: any) => { set = value; return query; }, where: async (condition: any) => { for (const row of this.rows(table)) if (this.matches(row, condition)) Object.assign(row, set); } };
    return query;
  }
  delete(table: any) { return { where: async (condition: any) => { this.tables[getTableName(table)] = this.rows(table).filter(row => !this.matches(row, condition)); } }; }
  async transaction<T>(callback: (tx: any) => Promise<T>) { return callback(this); }
}
