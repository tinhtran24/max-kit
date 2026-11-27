---
name: mk-document-skills
description: "Read, create and edit Word (docx), PDF, PowerPoint (pptx) and Excel (xlsx) files: tables, forms, slide decks, spreadsheets, workbook formulas."
when_to_use: "Invoke for any Office file; it routes to the nested skill."
category: media
keywords: [docx, pdf, pptx, xlsx, office, word, powerpoint, excel]
argument-hint: "<docx|pdf|pptx|xlsx> [path] [action]"
metadata:
  author: max-kit
  version: "1.0.1"
---

# Document skills

Choose the requested output format and read its workflow:

- Word: [mk-docx](mk-docx/SKILL.md)
- PDF: [mk-pdf](mk-pdf/SKILL.md)
- PowerPoint: [mk-pptx](mk-pptx/SKILL.md)
- Spreadsheet: [mk-xlsx](mk-xlsx/SKILL.md)

Preserve supplied templates and existing content. For multiple formats, use each format's
workflow and validate each artifact; do not stop at routing. Distinguish extraction from
editing and render/inspect layout when relevant to the requested result.
