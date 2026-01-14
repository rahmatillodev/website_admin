import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Circle } from "lucide-react";
import { toast } from "react-toastify";

const CardMultipleChoice = ({ q, parts, pIdx, gIdx, qIdx, setParts }) => {
  const options = ["A", "B", "C", "D"];

  const parseOptions = (text) => {
    const opts = { A: "", B: "", C: "", D: "" };
    if (!text) return opts;
    // Bazadan kelayotgan textni massivga ajratish
    text.split("\n").forEach((line) => {
      const match = line.match(/^([A-D])\.\s*(.+)$/);
      if (match) opts[match[1]] = match[2].trim();
    });
    return opts;
  };
  const currentOptions = parseOptions(q.question_text);

  const setCorrectAnswer = (letter) => {
    const selectedText = currentOptions[letter];
    if (!selectedText) {
      toast.error("Please enter option text first!");
      return;
    }

    const newParts = [...parts];
    console.log(newParts[pIdx].question_groups[gIdx].questions[qIdx].correct_answer);
    
    // Bazaga harf emas, matnni saqlaymiz
    newParts[pIdx].question_groups[gIdx].questions[qIdx].correct_answer = selectedText.trim();
    setParts(newParts);
  };
  const handleOptionChange = (letter, value) => {
    const currentOpts = parseOptions(q.question_text);
    currentOpts[letter] = value;
    
    // Variantlarni qayta stringga yig'ish
    const newQuestionText = options
      .map(l => currentOpts[l] ? `${l}. ${currentOpts[l]}` : "")
      .filter(Boolean)
      .join("\n");

    const newParts = [...parts];
    newParts[pIdx].question_groups[gIdx].questions[qIdx].question_text = newQuestionText;
    setParts(newParts);
  };


  // const currentOptions = parseOptions(q.question_text);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full mt-2">
      {options.map((letter) => {
        const optionText = currentOptions[letter] || "";
        // DBdan kelgan q.correct_answer ni hozirgi variant matni bilan solishtirish
        // Edit paytida belgilanmay qolmasligi uchun trim() ishlatamiz
        const isCorrect = q.correct_answer && 
                          optionText && 
                          q.correct_answer.trim() === optionText.trim();

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
  );
};

export default CardMultipleChoice;