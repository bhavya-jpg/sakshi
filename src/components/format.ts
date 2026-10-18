export const fmtTime = (t: number) =>
  new Date(t * 1000).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) + " IST"
export const short = (h?: string, n = 10) => (h ? `${h.slice(0, n)}…${h.slice(-6)}` : "-")
