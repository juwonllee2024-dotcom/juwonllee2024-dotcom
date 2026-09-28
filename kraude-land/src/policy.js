const HIGH_RISK=[
  /(^|\s)rm\s+-rf\b/i,
  /git\s+push\b/i,
  /git\s+merge\b/i,
  /npm\s+publish\b/i,
  /(?:gh|npm)\s+release\b/i,
  /(?:^|\s)(?:cat|less|head|tail)\s+[^\n]*(?:\.ssh|id_rsa|id_ed25519|\.env\b|credentials)/i,
  /(?:^|\s)rm\s+[^\n]*\.git\b/i,
  /(?:^|\s)git\s+clean\s+-[a-z]*f/i
];
export function authorizeCommand(command,{authorityGranted=false}={}){
  const risky=HIGH_RISK.some(r=>r.test(command));
  if(risky&&!authorityGranted)return {allowed:false,reason:'explicit authority required'};
  return {allowed:true,reason:risky?'authority granted':'safe command'};
}
