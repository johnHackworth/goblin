import sanitizeHtml from "sanitize-html";

export const params = {
  "allowedTags": ["address","article","aside","footer","header","h1","h2","h3","h4","h5","h6",
      "hgroup","main","nav","section","blockquote","dd","div","dl","dt","figcaption",
      "figure","hr","li","main","ol","p","pre","ul","a","abbr","b","bdi","bdo","br",
      "cite","code","data","dfn","em","i","kbd","mark","q","rb","rp","rt","rtc","ruby",
      "s","samp","small","span","strong","sub","sup","time","u","var","wbr","caption",
      "col","colgroup","table","tbody","td","tfoot","th","thead","tr", "img", "iframe"
  ],
  "disallowedTagsMode": "discard",
  "allowedAttributes": {
    "a": ["href","name","target"],
    "img":["src","srcset","alt","title","width","height","loading"],
    "iframe": [ 'width', 'height', 'allowfullscreen', 'autoplay', 'disablekbcontrols',
      'enableiframeapi', 'endtime', 'ivloadpolicy', 'loop', 'modestbranding', 'origin',
      'playlist', 'src', 'start'
    ],
    "span": ["style"]
  },
  "selfClosing": ["img","br","hr","area","base","basefont","input","link","meta"],
  "allowedSchemes": ["http","https","ftp","mailto","tel"],
  "allowedSchemesByTag": {},
  "allowedSchemesAppliedToAttributes": ["href","src","cite"],
  "allowProtocolRelative": true,
  "enforceHtmlBoundary": false,
  "parseStyleAttributes": true
}

export function sanitize(htmlText) {
  return sanitizeHtml(htmlText, params);
}