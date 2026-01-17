import React, { useRef, useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, X, Type } from "lucide-react";


const renderPreviewWithGaps = (text) => {
  if (!text) return null;
  let gapIndex = 0;

  // Har bir ___ ni alohida ajratib olish
  return text.split(/(___)/g).map((part, i) => {
    if (part === "___") {
      gapIndex++;
      return (
        <span key={i} className="inline-flex items-center gap-1 mx-1 px-1 bg-orange-50 border border-orange-200 rounded">
          <span className="flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-orange-600 text-white rounded-full">
            {gapIndex}
          </span>
          <span className="font-mono tracking-tighter text-orange-800 italic">___</span>
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
};

const CardDragDrop = ({ group, parts, pIdx, gIdx, setParts }) => {
  const textareaRef = useRef(null);
  const [newDistractor, setNewDistractor] = useState("");

  // Calculate total questions before this group (only count is_correct: true for drag_drop)
  const getQuestionCountBefore = (targetPartIdx, targetGroupIdx) => {
    let count = 0;
    for (let pIdx = 0; pIdx < parts.length; pIdx++) {
      for (let gIdx = 0; gIdx < parts[pIdx].question_groups.length; gIdx++) {
        const group = parts[pIdx].question_groups[gIdx];
        
        if (pIdx < targetPartIdx || (pIdx === targetPartIdx && gIdx < targetGroupIdx)) {
          if (group.type === "fill_in_blanks") {
            count += (group.answers || []).length;
          } else if (group.type === "drag_drop") {
            // Only count questions with is_correct: true
            count += (group.questions || []).filter(q => q.is_correct === true).length;
          } else {
            count += (group.questions || []).length;
          }
        } else {
          break;
        }
      }
      if (pIdx === targetPartIdx) break;
    }
    return count;
  };

  // 1. Matn o'zgarganda javoblar massivini sinxronlash
  const handleTextChange = (e) => {
    const text = e.target.value;
    const blanksCount = (text.match(/___/g) || []).length;

    const newParts = [...parts];
    const currentGroup = newParts[pIdx].question_groups[gIdx];
    currentGroup.content = text;
    currentGroup.question_text = text; // Store in question_text for DB

    // Separate correct answers (is_correct: true) from distractors (is_correct: false)
    const currentQuestions = currentGroup.questions || [];
    const correctAnswers = currentQuestions.filter(q => q.is_correct === true);
    const distractors = currentQuestions.filter(q => q.is_correct === false);

    // Update correct answers based on blanks count
    if (blanksCount > correctAnswers.length) {
      const diff = blanksCount - correctAnswers.length;
      const questionCountBefore = getQuestionCountBefore(pIdx, gIdx);
      const newGaps = Array(diff).fill(null).map((_, i) => ({
        question_number: questionCountBefore + correctAnswers.length + i + 1,
        correct_answer: "",
        question_text: "", // question_text stores the answer, not the full passage
        is_correct: true,
      }));
      currentGroup.questions = [...correctAnswers, ...newGaps, ...distractors];
    } else {
      // Keep only the first blanksCount correct answers, preserve distractors
      currentGroup.questions = [...correctAnswers.slice(0, blanksCount), ...distractors];
    }
    
    // Ensure question_text matches correct_answer for all questions (question_text stores the answer)
    currentGroup.questions = currentGroup.questions.map(q => {
      if (q.is_correct === true) {
        return { ...q, question_text: q.correct_answer || "" };
      }
      return { ...q, question_text: q.correct_answer || "" };
    });

    // Recalculate all question numbers globally (only for is_correct: true)
    let globalCounter = 1;
    for (let pIdx = 0; pIdx < newParts.length; pIdx++) {
      for (let gIdx = 0; gIdx < newParts[pIdx].question_groups.length; gIdx++) {
        const g = newParts[pIdx].question_groups[gIdx];
        if (g.type === "fill_in_blanks") {
          g._startQuestionNumber = globalCounter;
          globalCounter += (g.answers || []).length;
        } else if (g.type === "drag_drop") {
          // Only update question_number for is_correct: true questions
          const correctQs = (g.questions || []).filter(q => q.is_correct === true);
          const distractorQs = (g.questions || []).filter(q => q.is_correct === false);
          g.questions = [
            ...correctQs.map((q, idx) => ({
              ...q,
              question_number: globalCounter + idx,
              question_text: q.correct_answer || "", // question_text stores the answer, not the full passage
            })),
            ...distractorQs.map(q => ({
              ...q,
              question_number: null, // Distractors have null question_number
              question_text: q.correct_answer || "", // question_text stores the answer
            }))
          ];
          globalCounter += correctQs.length;
        } else {
          g.questions = (g.questions || []).map((q, idx) => ({
            ...q,
            question_number: globalCounter + idx,
          }));
          globalCounter += g.questions.length;
        }
      }
    }

    setParts(newParts);
  };

  // 2. Bo'sh joy qo'shish (___)
  const addBlank = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = group.content || "";
    const newContent = content.substring(0, start) + "___" + content.substring(end);

    const newParts = [...parts];
    const currentGroup = newParts[pIdx].question_groups[gIdx];
    currentGroup.content = newContent;
    currentGroup.question_text = newContent;
    
    // Separate correct answers from distractors
    const currentQuestions = currentGroup.questions || [];
    const correctAnswers = currentQuestions.filter(q => q.is_correct === true);
    const distractors = currentQuestions.filter(q => q.is_correct === false);
    
    // Add new correct answer with is_correct: true
    const questionCountBefore = getQuestionCountBefore(pIdx, gIdx);
    const newCorrectAnswer = {
      question_number: questionCountBefore + correctAnswers.length + 1,
      correct_answer: "",
      question_text: "", // question_text stores the answer, not the full passage
      is_correct: true,
    };
    
    currentGroup.questions = [...correctAnswers, newCorrectAnswer, ...distractors];
    
    // Ensure question_text matches correct_answer for all questions (question_text stores the answer)
    currentGroup.questions = currentGroup.questions.map(q => ({
      ...q,
      question_text: q.correct_answer || "",
    }));

    // Recalculate all question numbers globally (only for is_correct: true)
    let globalCounter = 1;
    for (let pIdx = 0; pIdx < newParts.length; pIdx++) {
      for (let gIdx = 0; gIdx < newParts[pIdx].question_groups.length; gIdx++) {
        const g = newParts[pIdx].question_groups[gIdx];
        if (g.type === "fill_in_blanks") {
          g._startQuestionNumber = globalCounter;
          globalCounter += (g.answers || []).length;
        } else if (g.type === "drag_drop") {
          // Only update question_number for is_correct: true questions
          const correctQs = (g.questions || []).filter(q => q.is_correct === true);
          const distractorQs = (g.questions || []).filter(q => q.is_correct === false);
          g.questions = [
            ...correctQs.map((q, idx) => ({
              ...q,
              question_number: globalCounter + idx,
              question_text: q.correct_answer || "", // question_text stores the answer, not the full passage
            })),
            ...distractorQs.map(q => ({
              ...q,
              question_number: null, // Distractors have null question_number
              question_text: q.correct_answer || "", // question_text stores the answer
            }))
          ];
          globalCounter += correctQs.length;
        } else {
          g.questions = (g.questions || []).map((q, idx) => ({
            ...q,
            question_number: globalCounter + idx,
          }));
          globalCounter += g.questions.length;
        }
      }
    }

    setParts(newParts);

    setTimeout(() => {
      textarea.focus();
      const newPos = start + 4;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const addDistractor = () => {
    if (!newDistractor.trim()) return;
    const newParts = [...parts];
    const currentGroup = newParts[pIdx].question_groups[gIdx];
    const currentQuestions = currentGroup.questions || [];
    
    // Add distractor as a question with is_correct: false and question_number: null
    const distractorAnswer = newDistractor.trim();
    const newDistractorQuestion = {
      correct_answer: distractorAnswer,
      question_text: distractorAnswer, // question_text stores the answer
      is_correct: false,
      question_number: null,
    };
    
    currentGroup.questions = [...currentQuestions, newDistractorQuestion];
    setParts(newParts);
    setNewDistractor("");
  };

  return (
    <div className="space-y-6 w-full">
      {/* TEXTAREA */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label className="text-xs font-bold text-orange-600 uppercase">Summary Text</Label>
          <Button type="button" size="sm" onClick={addBlank} className="h-8 bg-orange-600">
            <Type className="h-4 w-4 mr-2" /> Add Blank (___)
          </Button>
        </div>

        <Textarea
          ref={textareaRef}
          value={group.content || ""}
          onChange={handleTextChange}
          placeholder="Type text and use ___ for gaps..."
          className="min-h-[200px]"
        />
      </div>

      {/* PREVIEW */}
      {group.content && (
        <div className="p-4 rounded-lg border bg-orange-50/30 border-orange-100">
          <Label className="text-[10px] uppercase text-orange-400 mb-2 block font-bold">Live View</Label>
          <div className="text-sm leading-loose text-gray-800">
            {renderPreviewWithGaps(group.content)}
          </div>
        </div>
      )}

      {/* CORRECT ANSWERS */}
      {group.questions?.filter(q => q.is_correct === true).length > 0 && (
        <div className="space-y-3">
          <Label className="text-xs font-bold text-gray-500 uppercase">
            Correct Answers 
            <span className="ml-2 text-[10px] font-normal text-green-600">(correct answers)</span>
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {group.questions
              .filter(q => q.is_correct === true)
              .sort((a, b) => (a.question_number || 0) - (b.question_number || 0))
              .map((q, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 bg-white border border-green-200 rounded-md shadow-sm">
                  <span className="w-6 h-6 flex items-center justify-center bg-orange-600 text-white rounded text-[10px] font-bold">
                    {q.question_number || idx + 1}
                  </span>
                  <Input
                    value={q.correct_answer || ""}
                    placeholder={`Word for gap ${q.question_number || idx + 1}`}
                    className="h-8 text-sm"
                    onChange={(e) => {
                      const newParts = [...parts];
                      const currentGroup = newParts[pIdx].question_groups[gIdx];
                      const currentQuestions = currentGroup.questions || [];
                      const correctAnswers = currentQuestions.filter(q => q.is_correct === true).sort((a, b) => (a.question_number || 0) - (b.question_number || 0));
                      const distractors = currentQuestions.filter(q => q.is_correct === false);
                      const answerValue = e.target.value;
                      correctAnswers[idx].correct_answer = answerValue;
                      // question_text stores the answer, not the full passage
                      correctAnswers[idx].question_text = answerValue;
                      newParts[pIdx].question_groups[gIdx].questions = [...correctAnswers, ...distractors];
                      setParts(newParts);
                    }}
                  />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* DISTRACTORS */}
      <div className="space-y-3 border-t pt-4">
        <Label className="text-xs font-bold text-gray-500 uppercase">
          Distractors (Wrong Options)
          <span className="ml-2 text-[10px] font-normal text-red-600">(Wrong answers)</span>
        </Label>
        <div className="flex gap-2">
          <Input
            value={newDistractor}
            onChange={(e) => setNewDistractor(e.target.value)}
            placeholder="Add wrong option..."
            className="h-9"
            onKeyDown={(e) => e.key === "Enter" && addDistractor()}
          />
          <Button type="button" variant="outline" onClick={addDistractor} className="h-9 border-orange-200">
            <Plus className="h-4 w-4 text-orange-600" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {group.questions?.filter(q => q.is_correct === false).map((q, i) => (
            <span key={i} className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-xs rounded border">
              {q.correct_answer}
              <X className="w-3 h-3 cursor-pointer" onClick={() => {
                const newParts = [...parts];
                const currentQuestions = newParts[pIdx].question_groups[gIdx].questions || [];
                const distractors = currentQuestions.filter(q => q.is_correct === false);
                distractors.splice(i, 1);
                const correctAnswers = currentQuestions.filter(q => q.is_correct === true);
                newParts[pIdx].question_groups[gIdx].questions = [...correctAnswers, ...distractors];
                setParts(newParts);
              }} />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CardDragDrop;