import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  VerticalAlign,
  HeadingLevel,
  ShadingType,
} from 'docx';

interface DocxContent {
  title: string;
  sections: DocxSection[];
}

interface DocxSection {
  title: string;
  rows: { label: string; value: string }[];
}

// 테이블 셀 생성 헬퍼
function createCell(text: string, isHeader: boolean = false, width?: number): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: text,
            bold: isHeader,
            size: 20, // 10pt
          }),
        ],
        alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
      }),
    ],
    verticalAlign: VerticalAlign.CENTER,
    shading: isHeader ? {
      type: ShadingType.SOLID,
      color: "E8F4FD",
    } : undefined,
    width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
    margins: {
      top: 100,
      bottom: 100,
      left: 150,
      right: 150,
    },
  });
}

// 테이블 생성
function createTable(rows: { label: string; value: string }[]): Table {
  const tableRows = rows.map(row =>
    new TableRow({
      children: [
        createCell(row.label, true, 25),
        createCell(row.value, false, 75),
      ],
    })
  );

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    },
  });
}

// 멀티라인 테이블 생성 (내용이 긴 경우)
function createMultiLineTable(title: string, content: string): Table {
  return new Table({
    rows: [
      new TableRow({
        children: [
          createCell(title, true, 100),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: content.split('\n').map(line =>
              new Paragraph({
                children: [
                  new TextRun({
                    text: line,
                    size: 20,
                  }),
                ],
              })
            ),
            margins: {
              top: 100,
              bottom: 100,
              left: 150,
              right: 150,
            },
          }),
        ],
      }),
    ],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    },
  });
}

// 3열 테이블 생성 (성취기준 수준용)
function createThreeColumnTable(headers: string[], rows: string[][]): Table {
  const tableRows = [
    new TableRow({
      children: headers.map(h => createCell(h, true)),
    }),
    ...rows.map(row =>
      new TableRow({
        children: row.map(cell => createCell(cell, false)),
      })
    ),
  ];

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    },
  });
}

// 섹션 제목 생성
function createSectionTitle(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 26, // 13pt
      }),
    ],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
  });
}

export async function generateSchoolPlanDocx(data: any, type: string, selectedSheets?: any): Promise<Buffer> {
  const children: (Paragraph | Table)[] = [];

  // 문서 제목
  const docTitle = type === 'approval' ? '학교자율시간 승인 신청서' : (data.activity_name || '학교자율시간 계획서');
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: docTitle,
          bold: true,
          size: 36,
        }),
      ],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  children.push(new Paragraph({ children: [] }));

  if (type === 'approval') {
    // 승인 신청서
    children.push(createSectionTitle('기본 정보'));
    children.push(createTable([
      { label: '학교급', value: data.school_type || '' },
      { label: '대상 학년', value: data.grades?.join(', ') || '' },
      { label: '총 차시', value: `${data.total_hours || ''}차시` },
      { label: '운영 학기', value: data.semester?.join(', ') || '' },
      { label: '연계 교과', value: data.subjects?.join(', ') || '' },
      { label: '활동명', value: data.activity_name || '' },
    ]));

    if (data.requirements) {
      children.push(new Paragraph({ children: [] }));
      children.push(createSectionTitle('요구사항'));
      children.push(createMultiLineTable('요구사항', data.requirements));
    }

    if (data.necessity) {
      children.push(new Paragraph({ children: [] }));
      children.push(createSectionTitle('필요성'));
      children.push(createMultiLineTable('필요성', data.necessity));
    }

    if (data.overview) {
      children.push(new Paragraph({ children: [] }));
      children.push(createSectionTitle('개요'));
      children.push(createMultiLineTable('개요', data.overview));
    }
  } else {
    // 최종 계획서
    const sheets = selectedSheets || { basic: true, content: true, standards: true, teaching: true, lessons: true };

    if (sheets.basic) {
      children.push(createSectionTitle('1. 기본 정보'));
      children.push(createTable([
        { label: '학교급', value: data.school_type || '' },
        { label: '대상 학년', value: data.grades?.join(', ') || '' },
        { label: '총 차시', value: `${data.total_hours || ''}차시` },
        { label: '운영 학기', value: data.semester?.join(', ') || '' },
        { label: '연계 교과', value: data.subjects?.join(', ') || '' },
        { label: '활동명', value: data.activity_name || '' },
      ]));

      if (data.requirements) {
        children.push(new Paragraph({ children: [] }));
        children.push(createMultiLineTable('요구사항', data.requirements));
      }
      if (data.necessity) {
        children.push(new Paragraph({ children: [] }));
        children.push(createMultiLineTable('필요성', data.necessity));
      }
      if (data.overview) {
        children.push(new Paragraph({ children: [] }));
        children.push(createMultiLineTable('개요', data.overview));
      }
    }

    if (sheets.content && data.content_sets) {
      children.push(new Paragraph({ children: [] }));
      children.push(createSectionTitle('2. 내용체계'));

      data.content_sets.forEach((set: any, idx: number) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `세트 ${idx + 1}`,
                bold: true,
                size: 22,
              }),
            ],
            spacing: { before: 200, after: 100 },
          })
        );

        const contentRows = [
          { label: '영역명', value: set.domain || '' },
          { label: '핵심 아이디어', value: set.key_ideas?.join('\n') || '' },
          { label: '지식·이해', value: set.content_elements?.knowledge_and_understanding?.join('\n') || '' },
          { label: '과정·기능', value: set.content_elements?.process_and_skills?.join('\n') || '' },
          { label: '가치·태도', value: set.content_elements?.values_and_attitudes?.join('\n') || '' },
        ];

        children.push(createTable(contentRows));
      });
    }

    if (sheets.standards && data.standards) {
      children.push(new Paragraph({ children: [] }));
      children.push(createSectionTitle('3. 성취기준'));

      data.standards.forEach((std: any, idx: number) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `성취기준 ${idx + 1}`,
                bold: true,
                size: 22,
              }),
            ],
            spacing: { before: 200, after: 100 },
          })
        );

        children.push(createTable([
          { label: '코드', value: std.code || '' },
          { label: '성취기준', value: std.description || '' },
        ]));

        // 수준별 테이블
        const levelRows = std.levels?.map((level: any) => {
          const levelLabel = level.level === 'A' ? '상' : level.level === 'B' ? '중' : '하';
          return [levelLabel, level.description || ''];
        }) || [];

        if (levelRows.length > 0) {
          children.push(createThreeColumnTable(['수준', '설명'], levelRows));
        }
      });
    }

    if (sheets.teaching) {
      children.push(new Paragraph({ children: [] }));
      children.push(createSectionTitle('4. 교수학습 및 평가'));

      if (data.teaching_methods_text) {
        children.push(createMultiLineTable('교수학습방법', data.teaching_methods_text));
      }

      if (data.assessment_plan && data.assessment_plan.length > 0) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '평가계획',
                bold: true,
                size: 22,
              }),
            ],
            spacing: { before: 300, after: 100 },
          })
        );

        data.assessment_plan.forEach((plan: any, idx: number) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `평가 ${idx + 1}`,
                  bold: true,
                  size: 20,
                }),
              ],
              spacing: { before: 150, after: 50 },
            })
          );

          children.push(createTable([
            { label: '코드', value: plan.code || '' },
            { label: '성취기준', value: plan.description || '' },
            { label: '평가요소', value: plan.element || '' },
            { label: '수업평가방법', value: plan.method || '' },
            { label: '상 수준', value: plan.criteria_high || '' },
            { label: '중 수준', value: plan.criteria_mid || '' },
            { label: '하 수준', value: plan.criteria_low || '' },
          ]));
        });
      }
    }

    if (sheets.lessons && data.lesson_plans) {
      children.push(new Paragraph({ children: [] }));
      children.push(createSectionTitle('5. 차시별 지도계획'));

      // 차시별 계획 테이블
      const lessonTableRows = [
        new TableRow({
          children: [
            createCell('차시', true),
            createCell('학습주제', true),
            createCell('학습내용', true),
            createCell('교수학습자료', true),
          ],
        }),
        ...data.lesson_plans.map((lesson: any) => {
          const lessonNum = String(lesson.lesson_number).replace(/차시/g, '');
          return new TableRow({
            children: [
              createCell(lessonNum, false),
              createCell(lesson.topic || '', false),
              createCell(lesson.content || '', false),
              createCell(lesson.materials || '', false),
            ],
          });
        }),
      ];

      children.push(new Table({
        rows: lessonTableRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
        },
      }));
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
