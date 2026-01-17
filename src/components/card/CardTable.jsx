import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "react-toastify";

const CardTableMatching = ({ group, parts, pIdx, gIdx, setParts }) => {
  // Agar bazada ustunlar bo'lmasa, default holatda A-D ni ko'rsatadi
  const columns = group.options || ["A", "B", "C", "D"];
  const questions = group.questions || [];

  // --- USTUNLAR BILAN ISHLASH ---
  
  const addColumn = () => {
    const newParts = [...parts];
    const currentOptions = [...columns];
    
    // Keyingi harfni aniqlash (A -> B -> C...)
    const lastChar = currentOptions.length > 0 
      ? currentOptions[currentOptions.length - 1] 
      : "@"; // @ dan keyin A keladi
    const nextChar = String.fromCharCode(lastChar.charCodeAt(0) + 1);

    if (nextChar > "Z") {
      toast.error("Maximum columns reached!");
      return;
    }

    const currentGroup = newParts[pIdx].question_groups[gIdx];
    const newOptions = [...currentOptions, nextChar];
    currentGroup.options = newOptions;
    // Store column options in group-level question_text for persistence
    currentGroup.question_text = newOptions.join("\n");
    
    // Update all questions' options arrays to include the new column
    // Similar to multiple_choice structure
    currentGroup.questions.forEach(q => {
      if (!q.options || !Array.isArray(q.options)) {
        q.options = [];
      }
      // Add new option entry for the new column
      const isCorrect = q.correct_answer === nextChar;
      q.options.push({
        letter: nextChar,
        question_text: nextChar, // For table, option_text is the letter itself
        correct_answer: isCorrect ? nextChar : null,
        is_correct: isCorrect
      });
    });
    
    setParts(newParts);
  };

  const deleteColumn = (colIndex) => {
    if (columns.length <= 1) {
      toast.error("At least one column is required!");
      return;
    }

    const newParts = [...parts];
    const deletedLetter = columns[colIndex];
    const currentGroup = newParts[pIdx].question_groups[gIdx];
    
    // Remove the column
    const newOptions = columns.filter((_, idx) => idx !== colIndex);
    currentGroup.options = newOptions;
    // Update group-level question_text with remaining columns
    currentGroup.question_text = newOptions.join("\n");

    // Update all questions: remove the option from options array and clear correct_answer if it matches
    currentGroup.questions.forEach(q => {
      // Remove the option from options array
      if (q.options && Array.isArray(q.options)) {
        q.options = q.options.filter(opt => opt.letter !== deletedLetter);
      }
      
      // Clear correct_answer if it matches the deleted letter
      if (q.correct_answer === deletedLetter) {
        q.correct_answer = "";
        q.is_correct = false; // Mark as incorrect since answer was removed
      }
    });

    setParts(newParts);
  };

  // --- SAVOLLAR BILAN ISHLASH (O'zingizni kodingiz) ---

  const addQuestion = () => {
    const newParts = [...parts];
    const currentGroup = newParts[pIdx].question_groups[gIdx];
    
    if (!currentGroup.questions) currentGroup.questions = [];
    
    // Calculate next question number using global counter logic
    const getQuestionCountBefore = (targetPartIdx, targetGroupIdx) => {
      let count = 0;
      for (let pIdx = 0; pIdx < parts.length; pIdx++) {
        for (let gIdx = 0; gIdx < parts[pIdx].question_groups.length; gIdx++) {
          const group = parts[pIdx].question_groups[gIdx];
          
          if (pIdx < targetPartIdx || (pIdx === targetPartIdx && gIdx < targetGroupIdx)) {
            if (group.type === "fill_in_blanks") {
              count += (group.answers || []).length;
            } else if (group.type === "drag_drop") {
              count += (group.questions || []).filter(q => q.is_correct === true).length;
            } else if (group.type === "table") {
              count += (group.questions || []).length;
            } else {
              count += (group.questions || []).length;
            }
          } else if (pIdx === targetPartIdx && gIdx === targetGroupIdx) {
            break;
          }
        }
        if (pIdx === targetPartIdx) break;
      }
      return count;
    };
    
    const questionCountBefore = getQuestionCountBefore(pIdx, gIdx);
    const nextNum = questionCountBefore + questions.length + 1;
    
    // Initialize options array for the new question (same structure as multiple_choice)
    const initialOptions = columns.map(letter => ({
      letter: letter,
      question_text: letter, // For table, option_text is the letter itself
      correct_answer: null,
      is_correct: false
    }));
    
    currentGroup.questions.push({
      question_number: nextNum,
      question_text: "", // Question description text (e.g., "how a type of plant functions...")
      correct_answer: "", // Selected letter will be stored here
      is_correct: false, // Will be set to true when correct answer is selected
      options: initialOptions, // Initialize with options array (same as multiple_choice)
    });
    
    // Recalculate all question numbers globally
    let globalCounter = 1;
    for (let pIdx = 0; pIdx < newParts.length; pIdx++) {
      for (let gIdx = 0; gIdx < newParts[pIdx].question_groups.length; gIdx++) {
        const g = newParts[pIdx].question_groups[gIdx];
        if (g.type === "fill_in_blanks") {
          g._startQuestionNumber = globalCounter;
          globalCounter += (g.answers || []).length;
        } else if (g.type === "drag_drop") {
          const correctQs = (g.questions || []).filter(q => q.is_correct === true);
          const distractorQs = (g.questions || []).filter(q => q.is_correct === false);
          g.questions = [
            ...correctQs.map((q, idx) => ({
              ...q,
              question_number: globalCounter + idx,
            })),
            ...distractorQs.map(q => ({
              ...q,
              question_number: null,
            }))
          ];
          globalCounter += correctQs.length;
        } else if (g.type === "table") {
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

  const deleteQuestion = (qIdx) => {
    const newParts = [...parts];
    newParts[pIdx].question_groups[gIdx].questions.splice(qIdx, 1);
    
    // Recalculate all question numbers globally
    let globalCounter = 1;
    for (let pIdx = 0; pIdx < newParts.length; pIdx++) {
      for (let gIdx = 0; gIdx < newParts[pIdx].question_groups.length; gIdx++) {
        const g = newParts[pIdx].question_groups[gIdx];
        if (g.type === "fill_in_blanks") {
          g._startQuestionNumber = globalCounter;
          globalCounter += (g.answers || []).length;
        } else if (g.type === "drag_drop") {
          const correctQs = (g.questions || []).filter(q => q.is_correct === true);
          const distractorQs = (g.questions || []).filter(q => q.is_correct === false);
          g.questions = [
            ...correctQs.map((q, idx) => ({
              ...q,
              question_number: globalCounter + idx,
            })),
            ...distractorQs.map(q => ({
              ...q,
              question_number: null,
            }))
          ];
          globalCounter += correctQs.length;
        } else if (g.type === "table") {
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

  const setCorrectAnswer = (qIdx, letter) => {
    const newParts = [...parts];
    const question = newParts[pIdx].question_groups[gIdx].questions[qIdx];
    
    // Initialize options array if it doesn't exist
    if (!question.options || !Array.isArray(question.options)) {
      // Build options array from columns if it doesn't exist
      question.options = columns.map(col => ({
        letter: col,
        question_text: col,
        correct_answer: null,
        is_correct: false
      }));
    }
    
    // Update correct_answer with the selected letter
    question.correct_answer = letter;
    // Mark as correct when an answer is selected
    question.is_correct = true;
    
    // Update options array: set is_correct flags (same as multiple_choice)
    question.options.forEach(opt => {
      if (opt.letter === letter) {
        opt.is_correct = true;
        opt.correct_answer = letter;
      } else {
        opt.is_correct = false;
        opt.correct_answer = null;
      }
    });
    
    setParts(newParts);
  };


  return (
    <div className="space-y-6 w-full border-l-4 border-indigo-500 pl-4 py-2">
      {/* 1. DINAMIK USTUNLAR BOSHQARUVI */}
      <div className="bg-white p-4 rounded-lg border shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <Label className="text-xs font-bold text-gray-500 uppercase">
            Define Columns (A, B, C...)
          </Label>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={addColumn}
            className="h-7 text-xs bg-indigo-50 text-indigo-600 border-indigo-200"
          >
            <Plus className="w-3 h-3 mr-1" /> Add Column
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {columns.map((letter, idx) => (
            <div
              key={idx}
              className="group relative flex items-center justify-center w-12 h-12 bg-indigo-100 border-2 border-indigo-200 rounded-md shadow-sm transition-all hover:border-indigo-400"
            >
              <span className="font-black text-indigo-700 text-lg">{letter}</span>
              <button
                onClick={() => deleteColumn(idx)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 2. SAVOLLAR JADVALI */}
      <div className="space-y-4">
        <Label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
          Rows (Questions)
        </Label>
        
        {questions.map((q, qIdx) => (
          <div key={qIdx} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm transition-hover hover:shadow-md">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 flex items-center justify-center bg-gray-800 text-white rounded-md text-xs font-bold shrink-0">
                {q.question_number}
              </div>
              
              <div className="flex-1 space-y-4">
                <Input
                  value={q.question_text || ""}
                  onChange={(e) => {
                    const newParts = [...parts];
                    const question = newParts[pIdx].question_groups[gIdx].questions[qIdx];
                    // Store question description in question_text
                    question.question_text = e.target.value;
                    setParts(newParts);
                  }}
                  placeholder="Enter question (e.g. how a type of plant functions...)"
                  className="font-medium border-gray-300 focus:border-indigo-500"
                />

                <div className="overflow-x-auto pb-2">
                  <div className="flex gap-2">
                    {columns.map((letter) => {
                      // Check if this option is selected using options array or fallback to correct_answer
                      const optionEntry = (q.options || []).find(opt => opt.letter === letter);
                      const isSelected = optionEntry?.is_correct === true || q.correct_answer === letter;
                      return (
                        <button
                          key={letter}
                          type="button"
                          onClick={() => setCorrectAnswer(qIdx, letter)}
                          className={`flex flex-col items-center justify-center min-w-[50px] p-2 rounded-md border-2 transition-all ${
                            isSelected 
                              ? "border-indigo-600 bg-indigo-50 shadow-sm" 
                              : "border-gray-100 bg-gray-50 hover:border-gray-300"
                          }`}
                        >
                          <span className={`text-xs font-bold mb-1 ${isSelected ? "text-indigo-700" : "text-gray-400"}`}>
                            {letter}
                          </span>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? "border-indigo-600 bg-indigo-600" : "border-gray-300 bg-white"
                          }`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteQuestion(qIdx)}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={addQuestion}
        className="w-full border-2 border-dashed border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 h-12"
      >
        <Plus className="mr-2 h-5 w-5" /> Add New Question Row
      </Button>
    </div>
  );
};

export default CardTableMatching;