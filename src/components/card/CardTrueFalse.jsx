import React from "react";
import { Button } from "../ui/button";

const CardTrueFalse = ({q , parts, pIdx , gIdx , qIdx , setParts}) => {
  return (
    <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
      {["YES", "NO", "NOT GIVEN"].map((option) => (
        <Button
          key={option}
          type="button"
          size="sm"
          variant={q.correct_answer === option ? "default" : "ghost"}
          className={`text-xs px-4 h-8 ${
            q.correct_answer === option
              ? "bg-white shadow-sm text-blue-700 hover:bg-white"
              : "text-gray-500 hover:bg-gray-200"
          }`}
          onClick={() => {
            const newParts = [...parts];
            newParts[pIdx].question_groups[gIdx].questions[
              qIdx
            ].correct_answer = option;
            setParts(newParts);
          }}
        >
          {option}
        </Button>
      ))}
    </div>
  );
};

export default CardTrueFalse;
