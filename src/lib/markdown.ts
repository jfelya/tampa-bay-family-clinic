import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: false,
});

/** Render authored markdown from content blocks to HTML (build-time only). */
export function md(text: string): string {
  return marked.parse(text, { async: false }) as string;
}
