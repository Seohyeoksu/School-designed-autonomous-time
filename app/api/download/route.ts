import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data, selectedSheets } = body;

    const workbook = new ExcelJS.Workbook();

    if (type === 'approval') {
      // 승인 신청서
      const worksheet = workbook.addWorksheet('승인신청서');

      worksheet.columns = [
        { header: '항목', key: 'item', width: 20 },
        { header: '내용', key: 'content', width: 60 },
      ];

      const items = [
        { item: '학교급', content: data.school_type || '' },
        { item: '대상 학년', content: data.grades?.join(', ') || '' },
        { item: '총 차시', content: data.total_hours?.toString() || '' },
        { item: '운영 학기', content: data.semester?.join(', ') || '' },
        { item: '연계 교과', content: data.subjects?.join(', ') || '' },
        { item: '활동명', content: data.activity_name || '' },
        { item: '요구사항', content: data.requirements || '' },
        { item: '필요성', content: data.necessity || '' },
        { item: '개요', content: data.overview || '' },
      ];

      worksheet.addRows(items);

      // 스타일 적용
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2E8F0' },
      };
    } else if (type === 'final') {
      // 최종 계획서
      const sheets = selectedSheets || { basic: true, content: true, standards: true, teaching: true, lessons: true };
      const addedSheets: any[] = [];

      // 기본정보 시트
      if (sheets.basic) {
        const basicSheet = workbook.addWorksheet('기본정보');
        basicSheet.columns = [
          { header: '항목', key: 'item', width: 20 },
          { header: '내용', key: 'content', width: 60 },
        ];

        basicSheet.addRows([
          { item: '학교급', content: data.school_type || '' },
          { item: '대상학년', content: data.grades?.join(', ') || '' },
          { item: '총차시', content: data.total_hours?.toString() || '' },
          { item: '운영 학기', content: data.semester?.join(', ') || '' },
          { item: '연계 교과', content: data.subjects?.join(', ') || '' },
          { item: '활동명', content: data.activity_name || '' },
          { item: '요구사항', content: data.requirements || '' },
          { item: '필요성', content: data.necessity || '' },
          { item: '개요', content: data.overview || '' },
        ]);
        addedSheets.push(basicSheet);
      }

      // 내용체계 시트
      if (sheets.content) {
        const contentSheet = workbook.addWorksheet('내용체계');
        contentSheet.columns = [
          { header: '구분', key: 'category', width: 25 },
          { header: '내용', key: 'content', width: 80 },
        ];

        if (data.content_sets) {
          data.content_sets.forEach((set: any, idx: number) => {
            contentSheet.addRow({
              category: `영역명 (세트${idx + 1})`,
              content: set.domain,
            });

            set.key_ideas?.forEach((idea: string) => {
              contentSheet.addRow({
                category: `핵심 아이디어 (세트${idx + 1})`,
                content: idea,
              });
            });

            set.content_elements?.knowledge_and_understanding?.forEach(
              (item: string) => {
                contentSheet.addRow({
                  category: `지식·이해 (세트${idx + 1})`,
                  content: item,
                });
              }
            );

            set.content_elements?.process_and_skills?.forEach((item: string) => {
              contentSheet.addRow({
                category: `과정·기능 (세트${idx + 1})`,
                content: item,
              });
            });

            set.content_elements?.values_and_attitudes?.forEach(
              (item: string) => {
                contentSheet.addRow({
                  category: `가치·태도 (세트${idx + 1})`,
                  content: item,
                });
              }
            );
          });
        }
        addedSheets.push(contentSheet);
      }

      // 성취기준 시트
      if (sheets.standards) {
        const standardsSheet = workbook.addWorksheet('성취기준');
        standardsSheet.columns = [
          { header: '성취기준코드', key: 'code', width: 15 },
          { header: '성취기준설명', key: 'description', width: 50 },
          { header: '수준', key: 'level', width: 10 },
          { header: '수준별설명', key: 'levelDesc', width: 60 },
        ];

        if (data.standards) {
          data.standards.forEach((std: any) => {
            std.levels?.forEach((level: any) => {
              const levelLabel =
                level.level === 'A' ? '상' : level.level === 'B' ? '중' : '하';
              standardsSheet.addRow({
                code: std.code,
                description: std.description,
                level: levelLabel,
                levelDesc: level.description,
              });
            });
          });
        }
        addedSheets.push(standardsSheet);
      }

      // 교수학습 및 평가 시트
      if (sheets.teaching) {
        const teachingSheet = workbook.addWorksheet('교수학습및평가');
        teachingSheet.columns = [
          { header: '유형', key: 'type', width: 14 },
          { header: '코드', key: 'code', width: 14 },
          { header: '성취기준', key: 'standard', width: 30 },
          { header: '평가요소', key: 'element', width: 30 },
          { header: '수업평가방법', key: 'method', width: 30 },
          { header: '상기준', key: 'high', width: 30 },
          { header: '중기준', key: 'mid', width: 30 },
          { header: '하기준', key: 'low', width: 30 },
        ];

        // 교수학습방법
        if (data.teaching_methods_text) {
          const methods = data.teaching_methods_text.split('\n').filter((line: string) => line.trim());
          methods.forEach((method: string) => {
            teachingSheet.addRow({
              type: '교수학습방법',
              code: '',
              standard: '',
              element: '',
              method: method.trim(),
              high: '',
              mid: '',
              low: '',
            });
          });
        }

        // 평가계획
        if (data.assessment_plan) {
          data.assessment_plan.forEach((plan: any) => {
            teachingSheet.addRow({
              type: '평가계획',
              code: plan.code,
              standard: plan.description,
              element: plan.element,
              method: plan.method,
              high: plan.criteria_high,
              mid: plan.criteria_mid,
              low: plan.criteria_low,
            });
          });
        }
        addedSheets.push(teachingSheet);
      }

      // 차시별계획 시트
      if (sheets.lessons) {
        const lessonsSheet = workbook.addWorksheet('차시별계획');
        lessonsSheet.columns = [
          { header: '차시', key: 'number', width: 10 },
          { header: '학습주제', key: 'topic', width: 30 },
          { header: '학습내용', key: 'content', width: 80 },
          { header: '교수학습자료', key: 'materials', width: 50 },
        ];

        if (data.lesson_plans) {
          data.lesson_plans.forEach((lesson: any) => {
            lessonsSheet.addRow({
              number: lesson.lesson_number,
              topic: lesson.topic,
              content: lesson.content,
              materials: lesson.materials,
            });
          });
        }
        addedSheets.push(lessonsSheet);
      }

      // 모든 시트에 스타일 적용
      addedSheets.forEach((sheet) => {
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE2E8F0' },
        };
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    const filename = data.activity_name || '계획서';
    const encodedFilename = encodeURIComponent(filename);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodedFilename}.xlsx"; filename*=UTF-8''${encodedFilename}.xlsx`,
      },
    });
  } catch (error: any) {
    console.error('Download API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
