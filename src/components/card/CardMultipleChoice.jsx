import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle } from "lucide-react";
import { toast } from "react-toastify";
import { Label } from "@/components/ui/label";

const CardMultipleChoice = ({ q, parts, pIdx, gIdx, qIdx, setParts }) => {
  const options = ["A", "B", "C", "D"];

  // Get options from separate question entries (q.options array)
  // Each option is stored as a separate question entry with letter as identifier
  const getOptionByLetter = (letter) => {
    if (!q.options || !Array.isArray(q.options)) return null;
    return q.options.find(opt => opt.letter === letter) || null;
  };

  // Handle question text change
  const handleQuestionTextChange = (value) => {
    const newParts = [...parts];
    newParts[pIdx].question_groups[gIdx].questions[qIdx].question_text = value;
    setParts(newParts);
  };

  // Handle option text change
  const handleOptionChange = (letter, value) => {
    const newParts = [...parts];
    const question = newParts[pIdx].question_groups[gIdx].questions[qIdx];
    
    // Initialize options array if it doesn't exist
    if (!question.options || !Array.isArray(question.options)) {
      question.options = [];
    }
    
    // Find or create option entry
    let optionEntry = question.options.find(opt => opt.letter === letter);
    if (!optionEntry) {
      optionEntry = { letter, question_text: value, correct_answer: null, is_correct: false };
      question.options.push(optionEntry);
    } else {
      optionEntry.question_text = value;
      // Update correct_answer if this was the correct option
      if (optionEntry.is_correct) {
        optionEntry.correct_answer = value.trim();
      }
    }
    
    setParts(newParts);
  };

  // Set correct answer
  const setCorrectAnswer = (letter) => {
    const newParts = [...parts];
    const question = newParts[pIdx].question_groups[gIdx].questions[qIdx];
    
    // Initialize options array if it doesn't exist
    if (!question.options || !Array.isArray(question.options)) {
      question.options = [];
    }
    
    let optionEntry = question.options.find(opt => opt.letter === letter);
    
    // Create option entry if it doesn't exist
    if (!optionEntry) {
      optionEntry = { letter, question_text: "", correct_answer: null, is_correct: false };
      question.options.push(optionEntry);
    }
    
    if (!optionEntry.question_text) {
      toast.error("Please enter option text first!");
      return;
    }

    // Set all options to incorrect first
    question.options.forEach(opt => {
      opt.is_correct = false;
      opt.correct_answer = null;
    });

    // Set the selected option as correct
    optionEntry.is_correct = true;
    optionEntry.correct_answer = optionEntry.question_text.trim();
    
    setParts(newParts);
  };

  return (
    <div className="space-y-4 w-full mt-2">
      {/* Question Text Input */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Question Text</Label>
        <Input
          value={q.question_text || ""}
          onChange={(e) => handleQuestionTextChange(e.target.value)}
          placeholder="Enter the question text..."
          className="w-full"
        />
      </div>

      {/* Options */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Options</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {options.map((letter) => {
            const optionEntry = getOptionByLetter(letter);
            const optionText = optionEntry?.question_text || "";
            const isCorrect = optionEntry?.is_correct === true;

            return (
              <div key={letter} className={`flex items-center gap-2 p-2 rounded-md border transition-colors ${
                isCorrect ? "border-green-500 bg-green-50" : "border-gray-200 bg-white"
              }`}>
                <Button
                  type="button" variant="ghost" size="icon"
                  onClick={() => setCorrectAnswer(letter)}
                  className={isCorrect ? "text-green-600" : "text-gray-400"}
                >
                  {isCorrect ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                </Button>
                <span className="font-bold w-4">{letter}.</span>
                <Input
                  value={optionText}
                  onChange={(e) => handleOptionChange(letter, e.target.value)}
                  placeholder={`Option ${letter}`}
                  className="border-none bg-transparent focus-visible:ring-0 h-8"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CardMultipleChoice;