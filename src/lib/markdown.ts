import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js/lib/core'
import java from 'highlight.js/lib/languages/java'
import kotlin from 'highlight.js/lib/languages/kotlin'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
import properties from 'highlight.js/lib/languages/properties'
import bash from 'highlight.js/lib/languages/bash'
import json from 'highlight.js/lib/languages/json'
import plaintext from 'highlight.js/lib/languages/plaintext'

hljs.registerLanguage('java', java)
hljs.registerLanguage('kotlin', kotlin)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('properties', properties)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('json', json)
hljs.registerLanguage('plaintext', plaintext)

const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'java'
      return hljs.highlight(code, { language }).value
    },
  }),
)

// Le contenu est local et écrit par nous : pas besoin de le filtrer.
export const renderMarkdown = (md: string) => marked.parse(md, { async: false })
export const renderInline = (md: string) => marked.parseInline(md, { async: false })
export const highlightCode = (code: string, language = 'java') => hljs.highlight(code, { language }).value
