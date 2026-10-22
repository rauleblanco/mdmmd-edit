import { defaultSchema } from 'rehype-sanitize'

/**
 * Custom schema for rehype-sanitize to allow:
 * - Math (KaTeX) markup and classes
 * - Shiki code highlighting tags, spans, and classes
 * - Mermaid container elements and data attributes
 * - GitHub alert classes and data attributes
 * - Heading IDs from rehype-slug
 * - Tables, task lists, and details/summary elements
 */
export const customSanitizeSchema = {
  ...defaultSchema,
  clobberPrefix: '',
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'svg',
    'path',
    'circle',
    'rect',
    'line',
    'polyline',
    'polygon',
    'text',
    'g',
    'tspan',
    'details',
    'summary',
    'input',
    'mark',
    'abbr',
    'sub',
    'sup',
    'kbd',
    'del',
    'ins',
    'math',
    'annotation',
    'semantics',
    'mrow',
    'mi',
    'mo',
    'mn',
    'msup',
    'msub',
    'mfrac',
    'msqrt',
    'mroot',
    'mtable',
    'mtr',
    'mtd',
    'mtext',
    'mspace',
  ],
  attributes: {
    ...defaultSchema.attributes,
    '*': [
      ...(defaultSchema.attributes?.['*'] || []),
      'className',
      'class',
      'id',
      'style',
      'data*',
      'aria*',
      'role',
      'tabIndex',
    ],
    code: [...(defaultSchema.attributes?.code || []), 'className', 'class', 'data*'],
    pre: [...(defaultSchema.attributes?.pre || []), 'className', 'class', 'data*'],
    div: [...(defaultSchema.attributes?.div || []), 'className', 'class', 'data*'],
    span: [...(defaultSchema.attributes?.span || []), 'className', 'class', 'data*'],
    input: ['type', 'disabled', 'checked'],
    svg: ['viewBox', 'width', 'height', 'fill', 'stroke', 'strokeWidth', 'xmlns', 'class', 'className'],
    path: ['d', 'fill', 'stroke', 'strokeWidth'],
    a: [...(defaultSchema.attributes?.a || []), 'href', 'target', 'rel', 'id'],
  },
}
