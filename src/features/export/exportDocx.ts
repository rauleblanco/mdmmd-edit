import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  AlignmentType,
} from 'docx'

/**
 * Generate a DOCX document blob from markdown text.
 */
export async function generateDocxBlob(markdown: string, title = 'Document'): Promise<Blob> {
  const lines = markdown.split(/\r?\n/)
  const docElements: (Paragraph | Table)[] = []

  let inCodeBlock = false
  let codeBuffer: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Code blocks
    if (line.trim().startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true
        codeBuffer = []
      } else {
        inCodeBlock = false
        // Add code block table or styled paragraph
        docElements.push(
          new Paragraph({
            children: [
              new TextRun({
                text: codeBuffer.join('\n'),
                font: 'Courier New',
                size: 20, // 10pt
                color: '334155',
              }),
            ],
            spacing: { before: 200, after: 200 },
          })
        )
        codeBuffer = []
      }
      continue
    }

    if (inCodeBlock) {
      codeBuffer.push(line)
      continue
    }

    // Skip YAML frontmatter
    if (i === 0 && line.trim() === '---') {
      let j = 1
      while (j < lines.length && lines[j].trim() !== '---') {
        j++
      }
      i = j
      continue
    }

    // Headings
    if (line.startsWith('# ')) {
      docElements.push(
        new Paragraph({
          text: line.replace('# ', '').trim(),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 360, after: 120 },
        })
      )
    } else if (line.startsWith('## ')) {
      docElements.push(
        new Paragraph({
          text: line.replace('## ', '').trim(),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 280, after: 100 },
        })
      )
    } else if (line.startsWith('### ')) {
      docElements.push(
        new Paragraph({
          text: line.replace('### ', '').trim(),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 80 },
        })
      )
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // Bullet list
      docElements.push(
        new Paragraph({
          text: line.replace(/^[-*]\s+/, '').trim(),
          bullet: { level: 0 },
          spacing: { before: 60, after: 60 },
        })
      )
    } else if (/^\d+\.\s+/.test(line)) {
      // Numbered list
      docElements.push(
        new Paragraph({
          text: line.replace(/^\d+\.\s+/, '').trim(),
          numbering: { reference: 'numbered-list', level: 0 },
          spacing: { before: 60, after: 60 },
        })
      )
    } else if (line.startsWith('> ')) {
      // Blockquote / Alert
      docElements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line.replace(/^>\s*/, '').trim(),
              italics: true,
              color: '475569',
            }),
          ],
          indent: { left: 720 },
          spacing: { before: 120, after: 120 },
        })
      )
    } else if (line.trim().length > 0) {
      // Regular paragraph
      docElements.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              size: 24, // 12pt
            }),
          ],
          spacing: { before: 80, after: 80 },
        })
      )
    }
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'numbered-list',
          levels: [
            {
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: AlignmentType.START,
              style: {
                paragraph: {
                  indent: { left: 720, hanging: 360 },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {},
        children: docElements,
      },
    ],
  })

  return await Packer.toBlob(doc)
}
