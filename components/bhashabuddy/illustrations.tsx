export function JourneyIllustration() {
  return (
    <div className="journey-art" aria-label="An illustrated street map for finding your way">
      <div className="journey-art__top">
        <span>FIELD NOTES / 08</span>
        <span>HYDERABAD · 17:40</span>
      </div>
      <svg viewBox="0 0 760 490" role="img" aria-label="A route through a neighbourhood to the bus station">
        <rect width="760" height="490" fill="#dce8d9" />
        <path d="M0 120H760M0 370H760M160 0V490M500 0V490" stroke="#c1d1c0" strokeWidth="1" />
        <path d="M0 166H760M0 324H760M204 0V490M456 0V490" stroke="#f5f1e8" strokeWidth="34" />
        <path d="M0 166H760M0 324H760M204 0V490M456 0V490" stroke="#e5dfd1" strokeWidth="1" strokeDasharray="5 8" />
        <path d="M70 420C170 420 182 410 204 382V255C204 224 229 207 258 207H410C438 207 456 188 456 160V86" fill="none" stroke="#e9684b" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 0" />
        <circle cx="70" cy="420" r="11" fill="#e9684b" />
        <circle cx="70" cy="420" r="20" fill="none" stroke="#e9684b" strokeOpacity=".25" strokeWidth="7" />
        <circle cx="456" cy="86" r="13" fill="#242a25" />
        <path d="M456 61v-19m0 90v-18m-28-28h-18m90 0h-18" stroke="#242a25" strokeWidth="2" />
        <g transform="translate(63 47)">
          <path d="M0 34 61 0l61 34v75H0z" fill="#f5f1e8" stroke="#242a25" strokeWidth="2" />
          <path d="M13 43h34v30H13zm47 0h34v30H60zM40 77h24v32H40z" fill="#d1d7c9" stroke="#242a25" strokeWidth="2" />
          <path d="M-8 37 61-4l69 41" fill="none" stroke="#242a25" strokeWidth="3" />
          <path d="M10 23h102" stroke="#e9684b" strokeWidth="4" />
        </g>
        <g transform="translate(556 240)">
          <path d="M0 64 39 23h71l36 41v78H0z" fill="#e9b98f" stroke="#242a25" strokeWidth="2" />
          <path d="M24 68h35v29H24zm46 0h35v29H70zm-34 42h26v32H36z" fill="#f5f1e8" stroke="#242a25" strokeWidth="2" />
          <path d="m39 23 18-26h43l10 26" fill="#d98760" stroke="#242a25" strokeWidth="2" />
          <path d="M0 64h146" stroke="#242a25" strokeWidth="3" />
        </g>
        <g transform="translate(330 23)">
          <rect width="178" height="47" fill="#f5f1e8" />
          <text x="14" y="19" fill="#657363" fontSize="10" fontFamily="Arial" letterSpacing="2">YOUR DESTINATION</text>
          <text x="14" y="37" fill="#242a25" fontSize="17" fontFamily="Georgia">Bus station</text>
        </g>
        <g transform="translate(288 255)">
          <rect width="144" height="48" fill="#242a25" />
          <text x="13" y="19" fill="#dce8d9" fontSize="10" fontFamily="Arial" letterSpacing="1.5">SAY IT AS YOU GO</text>
          <text x="13" y="37" fill="#f5f1e8" fontSize="15" fontFamily="Georgia">ఎక్కడ ఉంది?</text>
        </g>
      </svg>
      <div className="journey-art__caption">
        <span>01 / 30</span>
        <span>Useful words, in the places you need them.</span>
      </div>
    </div>
  );
}

export function SoundMarks() {
  return (
    <span className="sound-marks" aria-hidden="true">
      <i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i />
    </span>
  );
}
