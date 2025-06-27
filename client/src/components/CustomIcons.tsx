// Ícones customizados idênticos ao ChatGPT
export const CopyIcon = ({ size = 16, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <rect 
      x="9" 
      y="9" 
      width="13" 
      height="13" 
      rx="2" 
      ry="2" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="none"
    />
    <path 
      d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" 
      stroke="currentColor" 
      strokeWidth="2"
      fill="none"
    />
  </svg>
)

export const EditIcon = ({ size = 16, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <path 
      d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
)

export const SpeakerIcon = ({ size = 16, className = "" }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
  >
    <polygon 
      points="11,5 6,9 2,9 2,15 6,15 11,19" 
      stroke="currentColor" 
      strokeWidth="2" 
      fill="none"
    />
    <path 
      d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
    />
  </svg>
)