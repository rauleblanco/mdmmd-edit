import type { Root, Blockquote, Paragraph, Text } from 'mdast'
import type { Plugin } from 'unified'

const ALERT_TYPES = ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION'] as const
export type AlertType = (typeof ALERT_TYPES)[number]

const ALERT_REGEX = new RegExp(`^\\[!(${ALERT_TYPES.join('|')})\\](?:\\r?\\n|\\s*)?`, 'i')

/**
 * Remark plugin to transform GitHub-style blockquote alerts:
 * > [!NOTE]
 * > Content here
 *
 * into custom alert nodes with appropriate metadata and classes.
 */
export const remarkAlerts: Plugin<[], Root> = () => {
  return (tree) => {
    for (const node of tree.children) {
      if (node.type === 'blockquote') {
        const bq = node as Blockquote
        const firstChild = bq.children[0]
        if (firstChild && firstChild.type === 'paragraph') {
          const para = firstChild as Paragraph
          const firstInline = para.children[0]
          if (firstInline && firstInline.type === 'text') {
            const textNode = firstInline as Text
            const match = textNode.value.match(ALERT_REGEX)
            if (match) {
              const alertType = match[1].toUpperCase() as AlertType
              // Remove the [!TYPE] marker from the text
              textNode.value = textNode.value.replace(ALERT_REGEX, '')

              // If text becomes empty and there are more children in paragraph, remove it
              if (!textNode.value.trim() && para.children.length > 1) {
                para.children.shift()
              }

              // Enhance blockquote node with alert attributes
              bq.data = bq.data || {}
              bq.data.hName = 'div'
              bq.data.hProperties = {
                ...(bq.data.hProperties as Record<string, unknown> || {}),
                className: ['gh-alert', `gh-alert-${alertType.toLowerCase()}`],
                'data-alert-type': alertType,
              }
            }
          }
        }
      }
    }
  }
}
