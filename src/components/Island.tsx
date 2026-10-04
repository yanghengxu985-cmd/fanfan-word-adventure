export default function Island({ compact = false }: { compact?: boolean }) {
  return <svg className={`island-art ${compact ? 'compact' : ''}`} viewBox="0 0 600 380" role="img" aria-label="字词冒险岛：小路连接着书本小屋、树林和灯塔">
    <defs>
      <pattern id="water" width="55" height="26" patternUnits="userSpaceOnUse"><path d="M0 15q14-8 28 0" fill="none" stroke="#95c8c0" strokeWidth="2" opacity=".5"/></pattern>
      <filter id="shadow"><feDropShadow dx="0" dy="8" stdDeviation="5" floodColor="#1b5544" floodOpacity=".08"/></filter>
    </defs>
    <ellipse cx="315" cy="290" rx="242" ry="70" fill="#d7e8df"/>
    <ellipse cx="315" cy="300" rx="265" ry="62" fill="url(#water)"/>
    <path d="M90 254Q90 210 170 213Q175 182 242 191Q306 146 394 188Q480 181 507 221Q553 261 491 297Q414 327 337 319Q257 342 207 310Q100 307 90 254Z" fill="#b5ccc0"/>
    <path d="M87 243Q98 201 171 202Q175 169 247 179Q304 130 394 176Q477 166 505 209Q551 244 491 282Q406 313 337 303Q251 326 206 296Q101 297 87 243Z" fill="#d5dda4" stroke="#94b08b" strokeWidth="2"/>
    <path d="M164 276Q242 296 273 240T410 201Q451 210 473 247" fill="none" stroke="#f9edc4" strokeWidth="27" strokeLinecap="round"/>
    <path d="M164 276Q242 296 273 240T410 201Q451 210 473 247" fill="none" stroke="#ccb486" strokeWidth="2" strokeDasharray="5 7"/>
    <g filter="url(#shadow)">
      <path d="M258 212v-76l58-19 58 19v76l-58 13Z" fill="#f7efdb" stroke="#527762" strokeWidth="3"/>
      <path d="M247 139l67-59 75 55-14 13-61-41-54 44Z" fill="#cc7353" stroke="#955b45" strokeWidth="3" strokeLinejoin="round"/>
      <path d="M305 212v-47q16-18 29 0v47" fill="#337765"/>
      <rect x="277" y="155" width="15" height="23" rx="5" fill="#e6b960" stroke="#527762" strokeWidth="2"/>
      <rect x="344" y="155" width="15" height="23" rx="5" fill="#e6b960" stroke="#527762" strokeWidth="2"/>
      <path d="M300 113q13-5 21 2q13-7 24-1v22q-15-6-24 0q-10-7-21-3Z" fill="#fff9e9" stroke="#527762" strokeWidth="2"/>
      <path d="M321 115v21" stroke="#527762" strokeWidth="2"/>
    </g>
    <g stroke="#436e57" strokeWidth="3" strokeLinejoin="round">
      <path d="M165 229v-83M142 193h46" fill="none"/>
      <path d="M131 184q-20-19 1-38q-5-27 28-32q30-4 33 25q30 13 15 40q-2 20-31 15q-23 11-46-10Z" fill="#7da887"/>
      <path d="M429 187v-85" fill="none"/>
      <path d="M398 147l31-69 33 69h-19l25 29h-74l24-29Z" fill="#638c68"/>
    </g>
    <g transform="translate(464 175) rotate(8)">
      <path d="M0 70L8 9h29l8 61Z" fill="#fff5dc" stroke="#618977" strokeWidth="3"/>
      <path d="M9 9V-9h28V9M4-9h38L23-24Z" fill="#cc7956" stroke="#a76244" strokeWidth="2"/>
      <path d="M10 26h25M7 49h33" stroke="#dd9871" strokeWidth="13"/>
      <path d="M18 69V52h10v17" fill="#39775f"/>
      <path d="M15-5h15" stroke="#f6d976" strokeWidth="5"/>
    </g>
    <g transform="translate(190 220)">
      <path d="M0 0v43" stroke="#827552" strokeWidth="4"/>
      <path d="M-20 0h45l9 12-9 11h-45Z" fill="#f4cf6b" stroke="#a79c63" strokeWidth="2"/>
      <text x="5" y="16" textAnchor="middle" fontSize="12" fill="#49614d">Aa 字</text>
    </g>
    <g transform="translate(363 255)"><ellipse cx="0" cy="26" rx="22" ry="6" fill="#9ab18b"/><path d="M-15 17q-8-31 9-26l5 12q5-20 14-12q12 10 0 32Z" fill="#f2c46c" stroke="#a37c46" strokeWidth="2"/><circle cx="-4" cy="8" r="2" fill="#4b6553"/><circle cx="7" cy="8" r="2" fill="#4b6553"/><path d="M-3 16q5 5 9-1" fill="none" stroke="#4b6553" strokeWidth="2"/></g>
    <g fill="#fff8e2" stroke="#dbc897" strokeWidth="2"><path d="M103 105q-3-18 19-18q10-25 35-10q20-7 24 13q25 1 21 15Z"/><path d="M414 61q0-13 16-14q8-19 28-6q18-6 20 14q16 0 15 10Z"/></g>
    <g fill="#e7bd66"><path d="M224 56l3-8 3 8 8 3-8 3-3 8-3-8-8-3Z"/><path d="M532 158l3-7 3 7 7 3-7 3-3 7-3-7-7-3Z"/></g>
    <g stroke="#52846b" strokeWidth="2"><path d="M125 267l-6-9m6 9 4-12m292 25-6-10m6 10 4-12"/><path d="M236 210l-4-9m4 9 5-8"/></g>
  </svg>;
}
