import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Layers, CheckSquare, Type, GripVertical, CircleDot, Table } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"; // Shadcn UI Accordion
import CardTrueFalse from "./CardTrueFalse";
import UploadMediaCard from "./UploadMediaCard";
import CardMultipleChoice from "./CardMultipleChoice";
import CardFillBlanks from "./CardFillBlanks";
import CardDragDrop from "./CardDragDrop";
import CardTableMatching from "./CardTable";
const ContentFormCard = ({
  part,
  pIdx,
  parts,
  setParts,
  deletePart,
  formData,
}) => {
  // Get icon and color for question type
  const getQuestionTypeInfo = (type) => {
    switch (type) {
      case "multiple_choice":
        return { icon: CircleDot, color: "bg-blue-100 text-blue-700 border-blue-300" };
      case "true_false_not_given":
        return { icon: CheckSquare, color: "bg-green-100 text-green-700 border-green-300" };
      case "fill_in_blanks":
        return { icon: Type, color: "bg-purple-100 text-purple-700 border-purple-300" };
      case "drag_drop":
        return { icon: GripVertical, color: "bg-orange-100 text-orange-700 border-orange-300" };
      case "table":
        return { icon: Table, color: "bg-indigo-100 text-indigo-700 border-indigo-300" };
      default:
        return { icon: Layers, color: "bg-gray-200 text-gray-700 border-gray-300" };
    }
  };

  // Calculate total questions before a specific part/group/question
  const getQuestionCountBefore = (targetPartIdx, targetGroupIdx, targetQuestionIdx = null) => {
    let count = 0;
    for (let pIdx = 0; pIdx < parts.length; pIdx++) {
      for (let gIdx = 0; gIdx < parts[pIdx].question_groups.length; gIdx++) {
        const group = parts[pIdx].question_groups[gIdx];
        
        if (pIdx < targetPartIdx || (pIdx === targetPartIdx && gIdx < targetGroupIdx)) {
          // Count all questions in groups before the target
          if (group.type === "fill_in_blanks") {
            count += (group.answers || []).length;
          } else if (group.type === "drag_drop") {
            // Only count questions with is_correct: true
            count += (group.questions || []).filter(q => q.is_correct === true).length;
          } else if (group.type === "table") {
            // Count questions in table matching
            count += (group.questions || []).length;
          } else {
            count += (group.questions || []).length;
          }
        } else if (pIdx === targetPartIdx && gIdx === targetGroupIdx && targetQuestionIdx !== null) {
          // Count questions before the target question in the same group
          if (group.type === "fill_in_blanks") {
            count += targetQuestionIdx;
          } else if (group.type === "drag_drop") {
            // Only count correct answers before target
            const correctBefore = (group.questions || []).filter(q => q.is_correct === true).slice(0, targetQuestionIdx);
            count += correctBefore.length;
          } else if (group.type === "table") {
            // Count questions before target
            count += targetQuestionIdx;
          } else {
            count += targetQuestionIdx;
          }
          break;
        }
      }
      if (pIdx === targetPartIdx) break;
    }
    return count;
  };

  // Question Group qo'shish
  const addQuestionGroup = (partIdx) => {
    const newParts = [...parts];
    const questionCountBefore = getQuestionCountBefore(partIdx, newParts[partIdx].question_groups.length);
    
    newParts[partIdx].question_groups.push({
      type: "multiple_choice",
      instruction: "",
      question_text: "", // Main passage/context for multiple_choice
      content: "", // For fill_in_blanks and drag_drop
      questions: [
        {
          question_number: questionCountBefore + 1,
          question_text: "", // Will contain options: "A. Option 1\nB. Option 2..."
          correct_answer: "", // Will contain the option text (not letter)
          explanation: null,
        },
      ],
    });
    
    // Recalculate global question numbers to ensure sequential numbering
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
            })),
            ...distractorQs.map(q => ({
              ...q,
              question_number: null, // Distractors have null question_number
            }))
          ];
          globalCounter += correctQs.length;
        } else if (g.type === "table") {
          // Count questions in table matching
          g.questions = (g.questions || []).map((q, idx) => ({
            ...q,
            question_number: globalCounter + idx,
          }));
          globalCounter += g.questions.length;
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

  // Savol qo'shish va avtomatik raqamlash
  const addQuestionToGroup = (partIdx, groupIdx) => {
    const newParts = [...parts];
    const group = newParts[partIdx].question_groups[groupIdx];
    const questionCountBefore = getQuestionCountBefore(partIdx, groupIdx);
    const nextNumber = questionCountBefore + group.questions.length + 1;

    group.questions.push({
      question_number: nextNumber,
      question_text: "",
      correct_answer: "",
      explanation: null,
    });
    
    // Recalculate all question numbers globally to ensure sequential numbering
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
            })),
            ...distractorQs.map(q => ({
              ...q,
              question_number: null, // Distractors have null question_number
            }))
          ];
          globalCounter += correctQs.length;
        } else if (g.type === "table") {
          // Count questions in table matching
          g.questions = (g.questions || []).map((q, idx) => ({
            ...q,
            question_number: globalCounter + idx,
          }));
          globalCounter += g.questions.length;
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

  // Savolni o'chirish va re-index
  const deleteQuestion = (partIdx, groupIdx, qIdx) => {
    const newParts = [...parts];
    const group = newParts[partIdx].question_groups[groupIdx];
    
    // Get the question number before deletion (for placeholder updates)
    const deletedQuestion = group.questions[qIdx];
    const deletedNum = deletedQuestion?.question_number;
    
    // Remove question from array
    const filtered = group.questions.filter((_, index) => index !== qIdx);

    // Qayta raqamlash - ensure global sequential numbering
    // For drag_drop, only renumber correct answers, keep distractors separate
    if (group.type === "drag_drop") {
      const correctQs = filtered.filter(q => q.is_correct === true);
      const distractorQs = filtered.filter(q => q.is_correct === false);
      const questionCountBefore = getQuestionCountBefore(partIdx, groupIdx);
      group.questions = [
        ...correctQs.map((q, i) => ({
          ...q,
          question_number: questionCountBefore + i + 1,
        })),
        ...distractorQs.map(q => ({
          ...q,
          question_number: null, // Distractors have null question_number
        }))
      ];
    } else {
      const questionCountBefore = getQuestionCountBefore(partIdx, groupIdx);
      group.questions = filtered.map((q, i) => ({
        ...q,
        question_number: questionCountBefore + i + 1,
      }));
    }

    // For fill_in_blanks, drag_drop, and table, update placeholders in content
    if ((group.type === "fill_in_blanks" || group.type === "drag_drop") && deletedNum) {
      // Remove placeholder [deletedNum] from content
      if (group.content) {
        group.content = group.content.replace(
          new RegExp(`\\[${deletedNum}\\]`, 'g'),
          ''
        );
        // Renumber remaining placeholders
        const placeholders = group.content.match(/\[(\d+)\]/g) || [];
        placeholders.forEach((placeholder) => {
          const oldNum = parseInt(placeholder.match(/\d+/)[0]);
          if (oldNum > deletedNum) {
            group.content = group.content.replace(
              new RegExp(`\\[${oldNum}\\]`, 'g'),
              `[${oldNum - 1}]`
            );
          }
        });
      }
    }
    // Table type questions are handled by deleteQuestion function above

    // Recalculate all question numbers globally after deletion
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
            })),
            ...distractorQs.map(q => ({
              ...q,
              question_number: null, // Distractors have null question_number
            }))
          ];
          globalCounter += correctQs.length;
        } else if (g.type === "table") {
          // Count questions in table matching
          g.questions = (g.questions || []).map((q, idx) => ({
            ...q,
            question_number: globalCounter + idx,
          }));
          globalCounter += g.questions.length;
        } else {
          g.questions = (g.questions || []).map((q, idx) => ({
            ...q,
            question_number: globalCounter + idx,
          }));
          globalCounter += g.questions.length;
        }
      }
    }

    // Also update part numbers to be sequential
    newParts.forEach((part, idx) => {
      part.part_number = idx + 1;
    });

    setParts(newParts);
  };

  // Question Groupni o'chirish (faqat shu part ichida)
  const deleteQuestionGroup = (partIdx, groupIdx) => {
    const newParts = [...parts];
    newParts[partIdx].question_groups = newParts[
      partIdx
    ].question_groups.filter((_, idx) => idx !== groupIdx);
    
    // Recalculate all question numbers globally after group deletion
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
            })),
            ...distractorQs.map(q => ({
              ...q,
              question_number: null, // Distractors have null question_number
            }))
          ];
          globalCounter += correctQs.length;
        } else if (g.type === "table") {
          // Count questions in table matching
          g.questions = (g.questions || []).map((q, idx) => ({
            ...q,
            question_number: globalCounter + idx,
          }));
          globalCounter += g.questions.length;
        } else {
          g.questions = (g.questions || []).map((q, idx) => ({
            ...q,
            question_number: globalCounter + idx,
          }));
          globalCounter += g.questions.length;
        }
      }
    }
    
    // Also update part numbers to be sequential
    newParts.forEach((part, idx) => {
      part.part_number = idx + 1;
    });
    
    setParts(newParts);
  };

  return (
    <div className="p-6 space-y-6">
        {/* Header qismi o'sha-o'sha qoladi */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-700">Part Settings</h2>
          </div>
          <div className="flex gap-2 w-1/2">
            <Input
              placeholder="Part Title (Optional)"
              value={part.title || ""}
              onChange={(e) => {
                const newParts = [...parts];
                newParts[pIdx].title = e.target.value;
                setParts(newParts);
              }}
              className="font-medium"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deletePart(pIdx)}
              className="text-red-500 hover:bg-red-50"
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <UploadMediaCard
          part={part}
          pIdx={pIdx}
          parts={parts}
          setParts={setParts}
          formData={formData}
        />

        {/* Question Groups Accordion */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-md font-semibold flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-500" /> Question Groups
            </h3>
          </div>

          <Accordion type="multiple" className="w-full space-y-3">
            {part.question_groups.map((group, gIdx) => (
              <AccordionItem
                key={gIdx}
                value={`group-${gIdx}`}
                className="border last:border-b rounded-xl bg-gray-50 px-4 overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-4 w-full text-left">
                    <span className="font-semibold text-gray-600">{gIdx + 1}.</span>
                    {(() => {
                      const typeInfo = getQuestionTypeInfo(group.type);
                      const Icon = typeInfo.icon;
                      return (
                        <span className={`${typeInfo.color} px-3 py-1 rounded-md text-xs font-bold uppercase flex items-center gap-1.5 border`}>
                          <Icon className="h-3 w-3" />
                          {group.type.replace(/_/g, " ")}
                        </span>
                      );
                    })()}
                    <span className="text-sm text-gray-500 truncate flex-1">
                      {group.instruction || "No instruction set"}
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                      {group.type === "fill_in_blanks" 
                        ? `${group.answers?.length || 0} ${(group.answers?.length || 0) === 1 ? "Question" : "Questions"}`
                        : group.type === "drag_drop"
                        ? `${(group.questions || []).filter(q => q.is_correct === true).length || 0} ${((group.questions || []).filter(q => q.is_correct === true).length || 0) === 1 ? "Question" : "Questions"}`
                        : group.type === "table"
                        ? `${group.questions?.length || 0} ${(group.questions?.length || 0) === 1 ? "Question" : "Questions"}`
                        : `${group.questions?.length || 0} ${(group.questions?.length || 0) === 1 ? "Question" : "Questions"}`
                      }
                    </span>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="pt-2 pb-4 space-y-4">
                  <div className="flex gap-3 items-end bg-white p-4 rounded-lg border shadow-sm">
                    <div className="flex-1 space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase">
                        Group Type & Instruction
                      </label>
                      <div className="flex gap-2">
                        <select
                          className="bg-gray-50 border rounded-md px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                          value={group.type}
                          onChange={(e) => {
                            const newParts = [...parts];
                            const newType = e.target.value;
                            newParts[pIdx].question_groups[gIdx].type = newType;
                            
                            // Initialize type-specific fields
                            if (newType === "multiple_choice") {
                              if (!newParts[pIdx].question_groups[gIdx].question_text) {
                                newParts[pIdx].question_groups[gIdx].question_text = "";
                              }
                              // Clear answers array if switching from fill_in_blanks
                              delete newParts[pIdx].question_groups[gIdx].answers;
                            } else if (newType === "fill_in_blanks") {
                              if (!newParts[pIdx].question_groups[gIdx].content) {
                                newParts[pIdx].question_groups[gIdx].content = "";
                              }
                              if (!newParts[pIdx].question_groups[gIdx].question_text) {
                                newParts[pIdx].question_groups[gIdx].question_text = "";
                              }
                              // Initialize answers array for fill_in_blanks
                              if (!newParts[pIdx].question_groups[gIdx].answers) {
                                newParts[pIdx].question_groups[gIdx].answers = [];
                              }
                              // Clear questions array as fill_in_blanks uses answers instead
                              if (newParts[pIdx].question_groups[gIdx].questions) {
                                newParts[pIdx].question_groups[gIdx].questions = [];
                              }
                            } else if (newType === "drag_drop") {
                              if (!newParts[pIdx].question_groups[gIdx].content) {
                                newParts[pIdx].question_groups[gIdx].content = "";
                              }
                              if (!newParts[pIdx].question_groups[gIdx].question_text) {
                                newParts[pIdx].question_groups[gIdx].question_text = "";
                              }
                              // Initialize questions array if empty, ensure is_correct flag exists
                              if (!newParts[pIdx].question_groups[gIdx].questions || newParts[pIdx].question_groups[gIdx].questions.length === 0) {
                                newParts[pIdx].question_groups[gIdx].questions = [];
                              } else {
                                // Ensure all existing questions have is_correct flag (default to true if missing)
                                newParts[pIdx].question_groups[gIdx].questions = newParts[pIdx].question_groups[gIdx].questions.map(q => ({
                                  ...q,
                                  is_correct: q.is_correct !== undefined ? q.is_correct : true,
                                }));
                              }
                              // Clear answers array if switching from fill_in_blanks
                              delete newParts[pIdx].question_groups[gIdx].answers;
                            } else if (newType === "table") {
                              // Initialize table matching structure
                              // Table matching uses questions array (each question is a row)
                              if (!newParts[pIdx].question_groups[gIdx].questions) {
                                newParts[pIdx].question_groups[gIdx].questions = [];
                              }
                              // Initialize options (columns) if not exists
                              if (!newParts[pIdx].question_groups[gIdx].options) {
                                newParts[pIdx].question_groups[gIdx].options = ["A", "B", "C", "D"];
                              }
                              // Clear answers array as table matching uses questions instead
                              delete newParts[pIdx].question_groups[gIdx].answers;
                              // Clear cells, rows, cols as they're not used for table matching
                              delete newParts[pIdx].question_groups[gIdx].cells;
                              delete newParts[pIdx].question_groups[gIdx].rows;
                              delete newParts[pIdx].question_groups[gIdx].cols;
                            } else {
                              // For other types (true_false_not_given, etc.)
                              // Clear answers array if switching from fill_in_blanks
                              delete newParts[pIdx].question_groups[gIdx].answers;
                            }
                            
                            setParts(newParts);
                          }}
                        >
                          <option value="multiple_choice">
                            Multiple Choice
                          </option>
                          <option value="true_false_not_given">
                            True/False/Not Given
                          </option>
                          <option value="fill_in_blanks">Fill in Blanks</option>
                          <option value="drag_drop">Drag and Drop</option>
                          <option value="table">Table Completion</option>
                        </select>
                        <Input
                          placeholder="Instruction (e.g. Write NO MORE THAN TWO WORDS)"
                          className="flex-1"
                          value={group.instruction || ""}
                          onChange={(e) => {
                            const newParts = [...parts];
                            newParts[pIdx].question_groups[gIdx].instruction =
                              e.target.value;
                            setParts(newParts);
                          }}
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteQuestionGroup(pIdx, gIdx)}
                      className="text-red-400 hover:text-red-600 mb-0.5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Group-level question text (main passage) for multiple_choice */}
                  {group.type === "multiple_choice" && (
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                      <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">
                        Main Passage / Question Context
                      </label>
                      <Input
                        placeholder="Enter the main passage or question context (optional)..."
                        value={group.question_text || ""}
                        onChange={(e) => {
                          const newParts = [...parts];
                          newParts[pIdx].question_groups[gIdx].question_text = e.target.value;
                          setParts(newParts);
                        }}
                        className="w-full"
                      />
                    </div>
                  )}

                  {/* Questions List - Only show for non-interactive types */}
                  {(group.type !== "fill_in_blanks" && group.type !== "drag_drop" && group.type !== "table") && (
                    <div className="space-y-3 pl-2 border-l-2 border-blue-100 ml-2">
                      {group.questions.map((q, qIdx) => (
                      <div
                        key={qIdx}
                        className="bg-white p-4 rounded-lg border shadow-sm space-y-3"
                      >
                        {/* Question UI (Bu yerda sizning MultipleChoice yoki TrueFalse komponentlaringiz turadi) */}
                        <div className="flex gap-3 items-start">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center shrink-0 mt-2">
                            {q.question_number}
                          </div>
                          <div className="flex-1 space-y-3">
                            {/* Question text input - only for non-multiple_choice types */}
                            {group.type !== "multiple_choice" && (
                              <Input
                                placeholder="Question text..."
                                value={q.question_text || ""}
                                onChange={(e) => {
                                  const newParts = [...parts];
                                  newParts[pIdx].question_groups[gIdx].questions[qIdx].question_text = e.target.value;
                                  setParts(newParts);
                                }}
                              />
                            )}

                            <div className="pl-2 border-l-2 border-gray-100">
                              {group.type === "true_false_not_given" ? (
                                <CardTrueFalse
                                  q={q}
                                  parts={parts}
                                  pIdx={pIdx}
                                  gIdx={gIdx}
                                  qIdx={qIdx}
                                  setParts={setParts}
                                />
                              ) : group.type === "multiple_choice" ? (
                                <CardMultipleChoice
                                  q={q}
                                  parts={parts}
                                  pIdx={pIdx}
                                  gIdx={gIdx}
                                  qIdx={qIdx}
                                  setParts={setParts}
                                />
                             
                              ) : (
                                <Input
                                  className="bg-green-50"
                                  placeholder="Correct Answer"
                                  value={q.correct_answer}
                                  onChange={(e) => {
                                    const newParts = [...parts];
                                    newParts[pIdx].question_groups[
                                      gIdx
                                    ].questions[qIdx].correct_answer =
                                      e.target.value;
                                    setParts(newParts);
                                  }}
                                />
                              )}
                            </div>
                            <Input
                              className="bg-blue-50/50 text-sm"
                              placeholder="Explanation (Optional)"
                              value={q.explanation || ""}
                              onChange={(e) => {
                                const newParts = [...parts];
                                newParts[pIdx].question_groups[gIdx].questions[
                                  qIdx
                                ].explanation = e.target.value;
                                setParts(newParts);
                              }}
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteQuestion(pIdx, gIdx, qIdx)}
                            className="text-gray-300 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 mt-4"
                        onClick={() => addQuestionToGroup(pIdx, gIdx)}
                      >
                        <Plus className="mr-2 h-3 w-3" /> Add Question
                      </Button>
                    </div>
                  )}
                  
                  {/* Interactive question types render their own UI */}
                  {(group.type === "fill_in_blanks" || group.type === "drag_drop" || group.type === "table") && (
                    <div className="pl-2 border-l-2 border-blue-100 ml-2">
                      {group.type === "fill_in_blanks" ? (
                        <CardFillBlanks
                          group={group}
                          parts={parts}
                          pIdx={pIdx}
                          gIdx={gIdx}
                          setParts={setParts}
                        />
                      ) : group.type === "drag_drop" ? (
                        <CardDragDrop
                          group={group}
                          parts={parts}
                          pIdx={pIdx}
                          gIdx={gIdx}
                          setParts={setParts}
                        />
                      ) : (
                        <CardTableMatching
                          group={group}
                          parts={parts}
                          pIdx={pIdx}
                          gIdx={gIdx}
                          setParts={setParts}
                        />
                      )}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <Button
            onClick={() => addQuestionGroup(pIdx)}
            variant="outline"
            className="w-full border-blue-400 text-blue-600 bg-blue-50/50 hover:bg-blue-50 py-6 border-dashed mt-10"
          >
            <Plus className="mr-2 h-4 w-4" /> Add New Question Group
          </Button>
        </div>
    </div>
  );
};

export default ContentFormCard;
