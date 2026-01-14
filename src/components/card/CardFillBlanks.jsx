import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * [N] formatidagi matnni chiroyli tag chiziqli raqamlar bilan ko'rsatish
 */
const renderPreviewWithUnderscores = (text) => {
  if (!text) return null;

  // [N] ko'rinishidagi barcha qismlarni qidiramiz
  const parts = text.split(/(\[\d+\])/g);

  return parts.map((part, i) => {
    const match = part.match(/\[(\d+)\]/);
    if (match) {
      const num = match[1];
      return (
        <span
          key={i}
          className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 bg-blue-100 border border-blue-300 rounded"
        >
          <span className="text-[10px] font-bold text-blue-600 leading-none">
            {num}
          </span>
          <span className="min-w-[40px] border-b-2 border-blue-500 text-center font-bold text-blue-800 bg-blue-50/50 px-1">
            &nbsp;&nbsp;&nbsp;
          </span>
        </span>
      );
    }
    return (
      <span key={i} className="text-gray-700">
        {part}
      </span>
    );
  });
};

const CardFillBlanks = ({ group, parts, pIdx, gIdx, setParts }) => {
  // Global savol raqamini hisoblash (Oldingi hamma part va grouplardagi savollar soni)
  const getQuestionCountBefore = (targetPartIdx, targetGroupIdx) => {
    let count = 0;
    for (let p = 0; p < parts.length; p++) {
      for (let g = 0; g < parts[p].question_groups.length; g++) {
        if (p < targetPartIdx || (p === targetPartIdx && g < targetGroupIdx)) {
          const gData = parts[p].question_groups[g];
          // Fill in blanks bo'lsa answers sonini, aks holda questions massivi uzunligini olamiz
          count +=
            gData.type === "fill_in_blanks"
              ? gData.answers?.length || 0
              : gData.questions?.length || 0;
        } else break;
      }
      if (p === targetPartIdx) break;
    }
    return count;
  };

  // MATN O'ZGARGANDA (___ ni [N] ga aylantirish)
  const handleTextChange = (e) => {
    let rawInput = e.target.value;
    const newParts = [...parts];
    const currentGroup = newParts[pIdx].question_groups[gIdx];

    // 1. Avval barcha ___ (3+ pastki chiziq) larni [blank] degan vaqtinchalik belgi bilan almashtiramiz
    // Bu foydalanuvchi yozayotganda chalkashmaslik uchun kerak
    let processedText = rawInput.replace(/_{3,}/g, "[blank]");

    // 2. Global boshlang'ich raqamni aniqlaymiz
    const startNum = getQuestionCountBefore(pIdx, gIdx) + 1;

    // 3. [blank] larni ketma-ket raqamlangan [N] ga aylantiramiz
    let counter = startNum;
    const finalText = processedText.replace(
      /\[blank\]/g,
      () => `[${counter++}]`
    );

    // Bo'shliqlar sonini aniqlash
    const blanksCount = (finalText.match(/\[\d+\]/g) || []).length;

    currentGroup.content = finalText;
    currentGroup.question_text = finalText; // Supabase uchun
    currentGroup._startQuestionNumber = startNum;

    // Javoblar massivini (answers) blanksCount ga qarab yangilaymiz
    const oldAnswers = currentGroup.answers || [];
    if (blanksCount > oldAnswers.length) {
      currentGroup.answers = [
        ...oldAnswers,
        ...Array(blanksCount - oldAnswers.length).fill(""),
      ];
    } else {
      currentGroup.answers = oldAnswers.slice(0, blanksCount);
    }

    setParts(newParts);
  };

  return (
    <div className="space-y-6">
      {/* ASOSIY EDITOR */}
      <div className="space-y-2">
        <Label className="text-xs font-bold uppercase text-blue-600 flex justify-between">
          <span>Passage Content</span>
          <span className="text-[10px] text-gray-400 font-normal">
            Use "___" (3 underscores) to create a blank
          </span>
        </Label>

        <Textarea
          // Ko'rinishda [N] larni yana ___ qilib ko'rsatamiz, shunda foydalanuvchiga qulay bo'ladi
          value={group.content?.replace(/\[\d+\]/g, "___") || ""}
          onChange={handleTextChange}
          placeholder="Example: The Great Wall of ___ was built during the ___ Dynasty."
          className="min-h-[200px] "
        />
      </div>

      {/* LIVE PREVIEW (TAGI CHIZIQLI) */}
      {group.content && (
        <div className="p-5 rounded-xl border bg-slate-50 shadow-sm">
          <Label className="text-[10px] uppercase text-slate-400 mb-3 block font-bold tracking-wider">
            Live Preview
          </Label>
          <div>{renderPreviewWithUnderscores(group.content)}</div>
        </div>
      )}

      {/* JAVOBLAR RO'YXATI */}
      {group.answers?.length > 0 && (
        <div className="space-y-4">
          <Label className="text-xs font-bold uppercase text-slate-500">
            Define Correct Answers
          </Label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {group.answers.map((answer, idx) => {
              const questionNumber = (group._startQuestionNumber || 1) + idx;

              return (
                <div
                  key={idx}
                  className="flex items-center gap-3 bg-white p-3 rounded-lg border shadow-sm hover:border-blue-300 transition-colors"
                >
                  <div className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full text-xs font-bold shrink-0 shadow-md">
                    {questionNumber}
                  </div>
                  <Input
                    value={answer}
                    onChange={(e) => {
                      const newParts = [...parts];
                      newParts[pIdx].question_groups[gIdx].answers[idx] =
                        e.target.value;
                      setParts(newParts);
                    }}
                    placeholder={`Answer for blank ${questionNumber}`}
                    className="border-none bg-transparent focus-visible:ring-0 p-0 text-sm"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CardFillBlanks;
