/**
 * The languages a lesson's code block can be marked with. Keys are what the
 * lesson JSON stores (and what the generator is told to use); each maps to the
 * highlight.js grammar it is coloured with. Kept small on purpose: grammars
 * are registered one by one so the lesson page does not ship all of
 * highlight.js for a few samples.
 */
import javascript from "react-syntax-highlighter/dist/esm/languages/hljs/javascript"
import typescript from "react-syntax-highlighter/dist/esm/languages/hljs/typescript"
import python from "react-syntax-highlighter/dist/esm/languages/hljs/python"
import java from "react-syntax-highlighter/dist/esm/languages/hljs/java"
import csharp from "react-syntax-highlighter/dist/esm/languages/hljs/csharp"
import cpp from "react-syntax-highlighter/dist/esm/languages/hljs/cpp"
import c from "react-syntax-highlighter/dist/esm/languages/hljs/c"
import go from "react-syntax-highlighter/dist/esm/languages/hljs/go"
import php from "react-syntax-highlighter/dist/esm/languages/hljs/php"
import sql from "react-syntax-highlighter/dist/esm/languages/hljs/sql"
import xml from "react-syntax-highlighter/dist/esm/languages/hljs/xml"
import css from "react-syntax-highlighter/dist/esm/languages/hljs/css"
import json from "react-syntax-highlighter/dist/esm/languages/hljs/json"
import yaml from "react-syntax-highlighter/dist/esm/languages/hljs/yaml"
import bash from "react-syntax-highlighter/dist/esm/languages/hljs/bash"
import plaintext from "react-syntax-highlighter/dist/esm/languages/hljs/plaintext"

export const CODE_LANGUAGES = {
  text: { label: "Code", grammar: plaintext },
  javascript: { label: "JavaScript", grammar: javascript },
  typescript: { label: "TypeScript", grammar: typescript },
  python: { label: "Python", grammar: python },
  java: { label: "Java", grammar: java },
  csharp: { label: "C#", grammar: csharp },
  cpp: { label: "C++", grammar: cpp },
  c: { label: "C", grammar: c },
  go: { label: "Go", grammar: go },
  php: { label: "PHP", grammar: php },
  sql: { label: "SQL", grammar: sql },
  html: { label: "HTML", grammar: xml },
  xml: { label: "XML", grammar: xml },
  css: { label: "CSS", grammar: css },
  json: { label: "JSON", grammar: json },
  yaml: { label: "YAML", grammar: yaml },
  bash: { label: "Shell", grammar: bash },
  pseudocode: { label: "Pseudocode", grammar: plaintext },
}

let registered = false

export function registerCodeLanguages(highlighter) {
  if (registered) return
  registered = true
  for (const [key, { grammar }] of Object.entries(CODE_LANGUAGES)) {
    highlighter.registerLanguage(key, grammar)
  }
}
