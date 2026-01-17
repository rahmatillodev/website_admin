import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  Save,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTestStore } from "@/stores/testStore";
import { toast } from "react-toastify";
import RightContentSidebar from "@/components/sidebar/RightContentSidebar";
import ContentFormCard from "@/components/card/ContentFormCard";
import { Input } from "@/components/ui/input";
import {
  
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

/**
 * Utility function to recalculate global question numbers across all parts and groups
 * Ensures sequential numbering: Part 1 Group 1 Q1-Q3, Part 1 Group 2 Q4-Q5, Part 2 Group 1 Q6-Q8, etc.
 * For fill_in_blanks, keeps ___ placeholders as-is in the content/question_text.
 */
const recalculateGlobalQuestionNumbers = (parts) => {
  let globalQuestionCounter = 1;

  return parts.map((part) => {
    const updatedPart = { ...part };
    updatedPart.question_groups = part.question_groups.map((group) => {
      const updatedGroup = { ...group };

      if (group.type === "fill_in_blanks") {
        // For fill_in_blanks, answers array length determines question count
        const answerCount = (group.answers || []).length;
        // Store the starting question number for this group
        updatedGroup._startQuestionNumber = globalQuestionCounter;
        
        // For fill_in_blanks, we keep ___ placeholders as-is (no conversion needed)
        // The content/question_text should already contain ___ placeholders
        // Just ensure both fields are consistent
        if (updatedGroup.content || updatedGroup.question_text) {
          const text = updatedGroup.content || updatedGroup.question_text || "";
          
          // Normalize any 4+ underscores to exactly 3 underscores
          const normalizedText = text.replace(/_{4,}/g, "___");
          
          // Store in both content and question_text for consistency
          updatedGroup.content = normalizedText;
          updatedGroup.question_text = normalizedText;
        }
        
        globalQuestionCounter += answerCount;
      } else if (group.type === "drag_drop") {
        // For drag_drop, only count questions with is_correct: true
        const correctQuestions = (group.questions || []).filter(q => q.is_correct === true);
        const distractors = (group.questions || []).filter(q => q.is_correct === false);
        const questionCount = correctQuestions.length;
        updatedGroup._startQuestionNumber = globalQuestionCounter;
        // Update question numbers only for correct answers, keep distractors with null
        // Ensure question_text matches correct_answer (question_text stores the answer, not the full passage)
        updatedGroup.questions = [
          ...correctQuestions.map((q, idx) => ({
            ...q,
            question_number: globalQuestionCounter + idx,
            question_text: q.correct_answer || q.question_text || "", // question_text stores the answer
          })),
          ...distractors.map(q => ({
            ...q,
            question_number: null, // Distractors have null question_number
            question_text: q.correct_answer || q.question_text || "", // question_text stores the answer
          }))
        ];
        globalQuestionCounter += questionCount;
      } else if (group.type === "table") {
        // For table matching, count all questions
        updatedGroup.questions = (group.questions || []).map((q, idx) => ({
          ...q,
          question_number: globalQuestionCounter + idx,
        }));
        globalQuestionCounter += group.questions.length;
      } else {
        // For multiple_choice, true_false, etc.
        updatedGroup.questions = (group.questions || []).map((q, idx) => ({
          ...q,
          question_number: globalQuestionCounter + idx,
        }));
        globalQuestionCounter += group.questions.length;
      }

      return updatedGroup;
    });

    return updatedPart;
  });
};

export default function ContentFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getTestById, loading, saveFullTest } = useTestStore();

  const [formData, setFormData] = useState({
    title: "",
    duration: 60,
    difficulty: "MEDIUM",
    type: "reading",
    is_premium: false,
    is_active: true,
  });

  const [parts, setParts] = useState([
    {
      part_number: 1,
      title: "",
      content: "",
      image_url: null,
      listening_url: null, // only part 1 will have listening_url, the rest will be empty
      question_groups: [
        {
          type: "multiple_choice",
          instruction: "",
          question_text: "",
          question_range: 1,
          questions: [
            {
              question_number: 1,
              question_text: "",
              correct_answer: "",
              explanation: null,
            },
          ],
        },
      ],
    },
  ]);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      const loadTest = async () => {
        const testData = await getTestById(id);
        if (testData) {
          // Set test-level data
          setFormData({
            title: testData.title || "",
            duration: testData.duration || 60,
            difficulty: testData.difficulty || "MEDIUM",
            type: testData.type || "reading",
            is_premium: testData.is_premium || false,
            is_active: testData.is_active !== false,
          });

          // Set parts data
          if (testData.part && testData.part.length > 0) {
            // First, format parts with question numbers as they are in DB
            const formattedParts = testData.part.map((part) => ({
              id: part.id,
              part_number: part.part_number || 1,
              title: part.title || "",
              content: part.content || "",
              image_url: part.image_url || null,
              listening_url: part.listening_url || null,
              question_groups: (part.question || []).map((qGroup) => {
                const questions = (qGroup.questions || []).map((q) => {
                  let correctAnswer = q.correct_answer || "";

                  // For multiple_choice, keep the correct_answer as text (not letter)
                  // The DB stores the option text in correct_answers, and we keep it as text
                  // CardMultipleChoice will match the text to determine which option is selected

                  return {
                    id: q.id,
                    question_number: q.question_number || 1,
                    question_text: q.question_text || "", // Contains options: "A. Option 1\nB. Option 2..."
                    correct_answer: correctAnswer, // Contains the option text (e.g., "Option 1")
                    explanation: q.explanation || null,
                    is_correct: q.is_correct !== undefined ? q.is_correct : null, // Include is_correct field for drag_drop type
                  };
                });

                // For fill_in_blanks, convert questions to answers array
                let groupData = {
                  id: qGroup.id,
                  type: qGroup.type || "multiple_choice",
                  instruction: qGroup.instruction || "",
                  questions: questions,
                };

                if (qGroup.type === "fill_in_blanks") {
                  // For fill_in_blanks, answers come from the questions' correct_answer (mapped from DB's correct_answers)
                  // The question_text contains the passage with ___ placeholders
                  const passageText = qGroup.question_text || qGroup.content || "";
                  groupData.content = passageText;
                  groupData.question_text = passageText; // Store in both for consistency
                  
                  // Extract answers from questions array, ordered by question_number
                  // Sort questions by question_number to ensure correct order
                  // For fill_in_blanks, question_text in DB should contain the answer, but we use correct_answer as fallback
                  const sortedQuestions = [...questions].sort((a, b) => 
                    (a.question_number || 0) - (b.question_number || 0)
                  );
                  groupData.answers = sortedQuestions.map(
                    (q) => q.question_text || q.correct_answer || "" // Prefer question_text (answer), fallback to correct_answer
                  );
                } else if (qGroup.type === "drag_drop") {
                  groupData.content =
                    qGroup.question_text || qGroup.content || "";
                  groupData.question_text = qGroup.question_text || qGroup.content || "";
                  
                  // Separate correct answers (is_correct: true) from distractors (is_correct: false)
                  // Only include items where is_correct is explicitly true
                  const correctAnswers = questions.filter(q => q.is_correct === true);
                  const distractors = questions.filter(q => q.is_correct === false);
                  
                  // Sort correct answers by question_number to ensure proper sequence
                  const sortedCorrectAnswers = [...correctAnswers].sort((a, b) => 
                    (a.question_number || 0) - (b.question_number || 0)
                  );
                  
                  // Store correct answers in questions array with is_correct: true
                  // For drag_drop, question_text in DB should contain the answer, not the full passage
                  groupData.questions = sortedCorrectAnswers.map(q => {
                    const answerText = q.question_text || q.correct_answer || "";
                    return {
                      id: q.id,
                      question_number: q.question_number || 1,
                      correct_answer: answerText,
                      question_text: answerText, // question_text stores the answer, not the full passage
                      is_correct: true,
                      explanation: q.explanation || null,
                    };
                  });
                  
                  // Store distractors in questions array with is_correct: false
                  const distractorQuestions = distractors.map(q => {
                    const answerText = q.question_text || q.correct_answer || "";
                    return {
                      id: q.id,
                      question_number: null,
                      correct_answer: answerText,
                      question_text: answerText, // question_text stores the answer
                      is_correct: false,
                      explanation: q.explanation || null,
                    };
                  });
                  
                  // Combine correct answers (sorted by question_number) and distractors
                  groupData.questions = [...groupData.questions, ...distractorQuestions];
                  
                } else if (qGroup.type === "table") {
                  // For table matching (SAME STRUCTURE as multiple_choice):
                  // - Question description is stored in questions.question_text
                  // - Correct answer (selected letter) is stored in questions.correct_answer with is_correct: true
                  // - ALL column options (A, B, C, D...) are stored in options table with is_correct flags
                  
                  // Get options from options table
                  const optionsFromDB = qGroup.options || [];
                  
                  // Extract column options from first question's options (since columns are shared)
                  // First, find all unique column letters from options table
                  const uniqueLettersSet = new Set(
                    optionsFromDB
                      .map(opt => opt.letter || opt.option_text)
                      .filter(Boolean)
                  );
                  const uniqueColumns = Array.from(uniqueLettersSet).sort((a, b) => {
                    const aVal = a || "";
                    const bVal = b || "";
                    return aVal.localeCompare(bVal);
                  });
                  
                  // Default to A, B, C, D if no options found
                  const extractedOptions = uniqueColumns.length > 0 ? uniqueColumns : ["A", "B", "C", "D"];
                  
                  // Store column options at group level
                  groupData.options = extractedOptions;
                  groupData.question_text = extractedOptions.join("\n");
                  
                  // Reconstruct questions with options array (same as multiple_choice)
                  groupData.questions = questions.map(q => {
                    const questionNumber = q.question_number || 1;
                    // For table type, question_text is null in DB, but we use empty string for UI state
                    const questionText = ""; // Table type doesn't have question_text in DB, use empty string for UI
                    const correctAnswerLetter = q.correct_answer || ""; // Selected letter (e.g., "A", "B", "C", "D")
                    
                    // Get ALL options for this question from options table (both correct and incorrect)
                    const allOptionsFromDB = optionsFromDB.filter(opt => 
                      opt.question_number === questionNumber
                    ).sort((a, b) => {
                      // Sort by letter (A, B, C, D)
                      return (a.letter || "").localeCompare(b.letter || "");
                    });
                    
                    // Build options array using the extracted column letters
                    const options = [];
                    
                    // Map options by letter from extractedOptions
                    extractedOptions.forEach(letter => {
                      const optionFromDB = allOptionsFromDB.find(opt => opt.letter === letter);
                      if (optionFromDB) {
                        // Use is_correct from DB, or check if letter matches correctAnswerLetter
                        const isCorrect = optionFromDB.is_correct === true || 
                                         letter === correctAnswerLetter;
                        options.push({
                          letter: letter,
                          question_text: letter, // For table, option_text is the letter itself
                          correct_answer: isCorrect ? letter : null,
                          is_correct: isCorrect,
                          id: optionFromDB.id
                        });
                      } else {
                        // Option doesn't exist in DB, add placeholder
                        const isCorrect = letter === correctAnswerLetter;
                        options.push({
                          letter: letter,
                          question_text: letter,
                          correct_answer: isCorrect ? letter : null,
                          is_correct: isCorrect
                        });
                      }
                    });
                    
                    return {
                      id: q.id,
                      question_number: questionNumber,
                      question_text: questionText, // Question description
                      correct_answer: correctAnswerLetter, // Selected letter
                      explanation: q.explanation || null,
                      options: options // Options array with is_correct flags
                    };
                  });
                  
                } else if (qGroup.type === "multiple_choice") {
                  // For multiple_choice (NEW STRUCTURE with options table):
                  // - Question text is stored in questions.question_text
                  // - Correct answer is stored in questions.correct_answer with is_correct: true
                  // - Incorrect options (wrong answers) are stored in options table
                  
                  // Get options from options table
                  const optionsFromDB = qGroup.options || [];
                  
                  // Reconstruct questions with options array
                  groupData.questions = questions.map(q => {
                    const questionNumber = q.question_number || 1;
                    const questionText = q.question_text || "";
                    const correctAnswerText = q.correct_answer || "";
                    
                    // Get ALL options for this question from options table (both correct and incorrect)
                    const allOptionsFromDB = optionsFromDB.filter(opt => 
                      opt.question_number === questionNumber
                    ).sort((a, b) => {
                      // Sort by letter (A, B, C, D)
                      return (a.letter || "").localeCompare(b.letter || "");
                    });
                    
                    // Build options array using letters A, B, C, D
                    const options = [];
                    const letters = ["A", "B", "C", "D"];
                    
                    // Map options by letter
                    letters.forEach(letter => {
                      const optionFromDB = allOptionsFromDB.find(opt => opt.letter === letter);
                      if (optionFromDB) {
                        const isCorrect = optionFromDB.is_correct === true || 
                                         (correctAnswerText && optionFromDB.option_text === correctAnswerText);
                        options.push({
                          letter: letter,
                          question_text: optionFromDB.option_text || "",
                          correct_answer: isCorrect ? (optionFromDB.option_text || correctAnswerText) : null,
                          is_correct: isCorrect,
                          id: optionFromDB.id
                        });
                      } else {
                        // Option doesn't exist in DB, add empty placeholder
                        options.push({
                          letter: letter,
                          question_text: "",
                          correct_answer: null,
                          is_correct: false
                        });
                      }
                    });
                    
                    return {
                      id: q.id,
                      question_number: questionNumber,
                      question_text: questionText,
                      correct_answer: correctAnswerText,
                      explanation: q.explanation || null,
                      options: options
                    };
                  });

                  groupData.question_text = qGroup.question_text || "";
                  groupData.question_range = groupData.questions.length;
                } else if (qGroup.type === "true_false_not_given") {
                  groupData.question_range = questions.length;
                }

                return groupData;
              }),

            }));

            // Then recalculate global question numbers sequentially
            const partsWithGlobalNumbers =
              recalculateGlobalQuestionNumbers(formattedParts);
            setParts(partsWithGlobalNumbers);
          }
        }
      };
      loadTest();
    }
  }, [id, getTestById]);

  // Calculate total questions across all parts
  const getTotalQuestionCount = (partsArray) => {
    let count = 0;
    for (const part of partsArray) {
      for (const group of part.question_groups || []) {
        if (group.type === "fill_in_blanks") {
          count += (group.answers || []).length;
        } else if (group.type === "drag_drop") {
          // Only count questions with is_correct: true
          count += (group.questions || []).filter(q => q.is_correct === true).length;
        } else if (group.type === "table") {
          // Count all questions in table matching
          count += (group.questions || []).length;
        } else {
          count += (group.questions || []).length;
        }
      }
    }
    return count;
  };

  // Add new part
  const addPart = () => {
    // Calculate the next question number based on all existing questions
    const totalQuestions = getTotalQuestionCount(parts);
    const nextQuestionNumber = totalQuestions + 1;

    const newPart = {
      part_number: parts.length + 1,
      title: "",
      content: "",
      image_url: null,
      listening_url: null,
      question_groups: [
        {
          type: "multiple_choice",
          instruction: "",
          question_text: "", // Main passage/context for multiple_choice
          distractors: [],
          questions: [
            {
              question_number: nextQuestionNumber,
              question_text: "", // Actual question text
              correct_answer: "", // Not used for multiple choice (stored in options)
              explanation: null,
              options: [], // Array of option entries: [{ letter: "A", question_text: "...", correct_answer: "...", is_correct: true/false }, ...]
            },
          ],
        },
      ],
    };
    const updatedParts = [...parts, newPart];
    // Recalculate to ensure sequential numbering
    const recalculatedParts = recalculateGlobalQuestionNumbers(updatedParts);
    setParts(recalculatedParts);
  };

  // Delete part
  // Partni o'chirish va qayta raqamlash
  const deletePart = (partIdx) => {
    const newParts = parts
      .filter((_, idx) => idx !== partIdx)
      .map((part, index) => ({
        ...part,
        part_number: index + 1, // Raqamlarni 1, 2, 3... qilib yangilaydi
      }));

    // Recalculate all question numbers globally after part deletion
    const recalculatedParts = recalculateGlobalQuestionNumbers(newParts);
    setParts(recalculatedParts);
  };

  // Question Groupni o'chirish (faqat shu part ichida)

  const handleSave = async () => {
    if (!formData.title.trim()) return toast.error("Please enter a test title");
    
    const hasEmptyParts = parts.some(
      (p) => !p.question_groups || p.question_groups.length === 0
    );
    if (hasEmptyParts)
      return toast.error("Each part must have at least one question group");
    
    setSaving(true);
    // Ensure question numbers are globally sequential before saving
    const partsWithSequentialNumbers = recalculateGlobalQuestionNumbers(parts);
    const success = await saveFullTest(
      id,
      formData,
      partsWithSequentialNumbers
    );

    if (success) {
      navigate("/content");
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Top Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 bg-white border-b shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-800">
            {id ? "Edit Test" : "New Practice Test"}
          </h1>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || loading}
          className="bg-blue-600 hover:bg-blue-700 shadow-md"
        >
          <Save className="mr-2 h-4 w-4" />{" "}
          {saving ? "Saving..." : "Publish Test"}
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Test Title */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Test Title</Label>
            <Input
              placeholder="Enter test title..."
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="text-lg"
            />
          </div>

          {/* Parts */}
          <Accordion
            type="multiple"
            defaultValue={["part-0"]}
            className="w-full space-y-4"
          >
            {parts.map((part, pIdx) => (
              <AccordionItem
                key={pIdx}
                value={`part-${pIdx}`}
                className="border rounded-lg mb-4 bg-white shadow-md"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline">
                  <div className="flex items-center gap-3 w-full">
                    <div className="bg-blue-600 text-white w-8 h-8 flex items-center justify-center rounded-lg font-bold shrink-0">
                      {part.part_number}
                    </div>
                    <span className="text-lg font-semibold text-gray-700">
                      {part.title || `Part ${part.part_number}`}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-0">
                  <ContentFormCard
                    part={part}
                    pIdx={pIdx}
                    parts={parts}
                    setParts={setParts}
                    deletePart={deletePart}
                    formData={formData}
                    setFormData={setFormData}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Add Part Button */}
          <Button onClick={addPart} variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" /> Add New Part
          </Button>
        </div>

        {/* Right Sidebar: Settings */}
        <RightContentSidebar
          formData={formData}
          setFormData={setFormData}
          parts={parts}
        />
      </div>
    </div>
  );
}
