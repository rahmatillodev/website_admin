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
 * For fill_in_blanks, also updates placeholders [N] in the content/question_text to match global question numbers.
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
        
        // Update placeholders in content/question_text to match global question numbers
        // Replace all [N] placeholders with new sequential numbers starting from globalQuestionCounter
        if (updatedGroup.content || updatedGroup.question_text) {
          const text = updatedGroup.content || updatedGroup.question_text || "";
          let updatedText = text;
          
          // Find all existing placeholders [N] and replace them sequentially
          const placeholderRegex = /\[\d+\]/g;
          const placeholders = text.match(placeholderRegex) || [];
          
          if (placeholders.length > 0) {
            // Replace placeholders one by one with new numbers
            let placeholderIndex = 0;
            updatedText = text.replace(placeholderRegex, () => {
              const newNumber = globalQuestionCounter + placeholderIndex;
              placeholderIndex++;
              return `[${newNumber}]`;
            });
          } else {
            // If no placeholders exist but we have answers, add them
            // This handles the case where content exists but placeholders weren't added yet
            // We'll let CardFillBlanks handle adding placeholders when user edits
          }
          
          // Store in both content and question_text for consistency
          updatedGroup.content = updatedText;
          updatedGroup.question_text = updatedText;
        }
        
        globalQuestionCounter += answerCount;
      } else if (group.type === "drag_drop") {
        // For drag_drop, only count questions with is_correct: true
        const correctQuestions = (group.questions || []).filter(q => q.is_correct === true);
        const distractors = (group.questions || []).filter(q => q.is_correct === false);
        const questionCount = correctQuestions.length;
        updatedGroup._startQuestionNumber = globalQuestionCounter;
        // Update question numbers only for correct answers, keep distractors with null
        updatedGroup.questions = [
          ...correctQuestions.map((q, idx) => ({
            ...q,
            question_number: globalQuestionCounter + idx,
          })),
          ...distractors.map(q => ({
            ...q,
            question_number: null, // Distractors have null question_number
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
                  // The question_text contains the passage with [N] placeholders
                  const passageText = qGroup.question_text || qGroup.content || "";
                  groupData.content = passageText;
                  groupData.question_text = passageText; // Store in both for consistency
                  
                  // Extract answers from questions array, ordered by question_number
                  // Sort questions by question_number to ensure correct order
                  const sortedQuestions = [...questions].sort((a, b) => 
                    (a.question_number || 0) - (b.question_number || 0)
                  );
                  groupData.answers = sortedQuestions.map(
                    (q) => q.correct_answer || ""
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
                  groupData.questions = sortedCorrectAnswers.map(q => ({
                    id: q.id,
                    question_number: q.question_number || 1,
                    correct_answer: q.correct_answer || "",
                    is_correct: true,
                    explanation: q.explanation || null,
                  }));
                  
                  // Store distractors in questions array with is_correct: false
                  const distractorQuestions = distractors.map(q => ({
                    id: q.id,
                    question_number: null,
                    correct_answer: q.correct_answer || "",
                    is_correct: false,
                    explanation: q.explanation || null,
                  }));
                  
                  // Combine correct answers (sorted by question_number) and distractors
                  groupData.questions = [...groupData.questions, ...distractorQuestions];
                  
                } else if (qGroup.type === "table") {
                  // For table matching:
                  // - Group-level question_text contains column options (A, B, C, D...) separated by newlines
                  // - Question-level question_text contains the question description
                  // - correct_answer contains the selected letter
                  // - is_correct: true for correct answers
                  // - options array contains the column letters
                  
                  // Extract options from group-level question_text
                  let extractedOptions = ["A", "B", "C", "D"]; // Default
                  
                  if (qGroup.question_text) {
                    const optionsFromText = qGroup.question_text.split("\n").filter(Boolean);
                    // Filter to only include single letters A-Z
                    extractedOptions = optionsFromText.filter(opt => /^[A-Z]$/.test(opt.trim()));
                    if (extractedOptions.length === 0) {
                      extractedOptions = ["A", "B", "C", "D"]; // Fallback to default
                    }
                  }
                  
                  groupData.options = extractedOptions;
                  groupData.question_text = qGroup.question_text || extractedOptions.join("\n");
                  
                  // Process questions: question_text contains question description
                  groupData.questions = questions.map(q => ({
                    id: q.id,
                    question_number: q.question_number || 1,
                    question_text: q.question_text || "", // Question description
                    correct_answer: q.correct_answer || "", // Selected letter
                    is_correct: q.is_correct !== undefined ? q.is_correct : (q.correct_answer ? true : false),
                    explanation: q.explanation || null,
                  }));
                  
                } else if (qGroup.type === "multiple_choice") {
                  // For multiple_choice:
                  // - Group-level question_text is the main passage/context (stored in DB's question.question_text)
                  // - Individual question's question_text contains the options (A. Option 1\nB. Option 2...)
                  // - Individual question's correct_answer contains the option text (not the letter)
                  // Note: The correct_answer mapping above already converts from text to letter for UI,
                  // but we need to keep the original text for saving back to DB
                  // The group-level question_text should come from the first question's context or be stored separately
                  // For now, we'll use qGroup.question_text as the group-level passage
                  groupData.question_text = qGroup.question_text || "";
                  // Calculate question_range
                  console.log("questions", questions);
                  groupData.question_range = questions.length;
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
              question_text: "", // Will contain options: "A. Option 1\nB. Option 2..."
              correct_answer: "", // Will contain the option text (not letter)
              explanation: null,
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
