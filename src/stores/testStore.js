import { create } from "zustand";
import supabase from "@/lib/supabase";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from 'uuid';
export const useTestStore = create((set, get) => ({
  tests: [],
  loading: false,
  error: null,

  fetchTests: async (page = 1, pageSize = 10) => {
    set({ loading: true, error: null });
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error } = await supabase
        .from("test")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);
      if (!error)
        set({ tests: data || [], totalCount: count || 0, loading: false });
      else set({ error: error.message, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      toast.error("Failed to load tests");
      console.error("Fetch tests error:", error);
    }
  },

  updateTest: async (testId, updates) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("test")
        .update(updates)
        .eq("id", testId)
        .select()
        .single();
      if (error) throw error;
      // Update local state
      set((state) => ({
        tests: state.tests.map((t) =>
          t.id === testId ? { ...t, ...updates, ...data } : t
        ),
        loading: false,
      }));
      toast.success("Test updated successfully");
    } catch (error) {
      set({ error: error.message, loading: false });
      toast.error("Failed to update test");
      console.error("Update test error:", error);
    }
  },

  deleteTest: async (testId) => {
    set({ loading: true, error: null });
    try {
      // 1. Get all parts related to this test
      const { data: existingParts, error: partsError } = await supabase
        .from("part")
        .select("id")
        .eq("test_id", testId);
      
      if (partsError) throw partsError;

      // 2. Delete related questions and question groups if parts exist
      if (existingParts && existingParts.length > 0) {
        const partIds = existingParts.map(p => p.id);
        
        // Get all question groups for these parts
        const { data: existingGroups, error: groupsError } = await supabase
          .from("question")
          .select("id")
          .in("part_id", partIds);
        
        if (groupsError) throw groupsError;

        if (existingGroups && existingGroups.length > 0) {
          const groupIds = existingGroups.map(g => g.id);
          
          // Delete questions (from questions table)
          const { error: questionsError } = await supabase
            .from("questions")
            .delete()
            .in("question_id", groupIds);
          
          if (questionsError) throw questionsError;

          // Delete question groups (from question table)
          const { error: questionGroupsError } = await supabase
            .from("question")
            .delete()
            .in("part_id", partIds);
          
          if (questionGroupsError) throw questionGroupsError;
        }

        // Delete parts
        const { error: partsDeleteError } = await supabase
          .from("part")
          .delete()
          .eq("test_id", testId);
        
        if (partsDeleteError) throw partsDeleteError;
      }

      // 3. Finally, delete the test itself
      const { error } = await supabase.from("test").delete().eq("id", testId);
      if (error) throw error;

      // Update local state
      set((state) => ({
        tests: state.tests.filter((t) => t.id !== testId),
        loading: false,
      }));
      toast.success("Test deleted successfully");
    } catch (error) {
      set({ error: error.message, loading: false });
      toast.error("Failed to delete test");
      console.error("Delete test error:", error.message);
    }
  },

  getTestById: async (testId) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("test")
        .select(
          `
          *,
          part (
            *,
            question (
              *,
              questions (*)
            )
          )
        `
        )
        .eq("id", testId)
        .single();

      if (error) throw error;
      set({ loading: false });
      console.log("data", data);
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      toast.error("Failed to fetch test details");
      console.error("Get test by id error:", error);
      return null;
    }
  },


  saveFullTest: async (id, formData, parts) => {
    set({ loading: true, error: null });
    try {
      let testId = id || uuidv4();
  
      // Calculate total question count
      let questionQuantity = 0;
      for (const partData of parts) {
        for (const groupData of partData.question_groups || []) {
          if (groupData.type === "fill_in_blanks") {
            questionQuantity += (groupData.answers || []).length;
          } else if (groupData.type === "drag_drop") {
            // Only count questions with is_correct: true
            questionQuantity += (groupData.questions || []).filter(q => q.is_correct === true).length;
          } else if (groupData.type === "table") {
            // Count all questions in table matching
            questionQuantity += (groupData.questions || []).length;
          } else {
            questionQuantity += (groupData.questions || []).length;
          }
        }
      }
  
      // 1. Test-level ma'lumotlarni saqlash
      if (id) {
        const testPayload = {
          title: formData.title,
          duration: parseInt(formData.duration),
          difficulty: formData.difficulty,
          type: formData.type,
          is_premium: formData.is_premium,
          is_active: formData.is_active,
          question_quantity: questionQuantity,
          updated_at: new Date().toISOString(),
        };
        const { error } = await supabase.from("test").update(testPayload).eq("id", id);
        if (error) throw error;
      } else {
        const testPayload = {
          id: testId, // Explicitly set UUID for new tests
          title: formData.title,
          duration: parseInt(formData.duration),
          difficulty: formData.difficulty,
          type: formData.type,
          is_premium: formData.is_premium,
          is_active: formData.is_active,
          question_quantity: questionQuantity,
          updated_at: new Date().toISOString(),
        };
        const { data, error } = await supabase.from("test").insert(testPayload).select().single();
        if (error) throw error;
        testId = data.id;
      }
  
      // 2. Edit rejimida eski bog'langan ma'lumotlarni tozalash (CASCADE delete bo'lsa buni qisqartirish mumkin)
      if (id) {
        // Avval hamma bog'langan question_id'larni olamiz
        const { data: existingParts } = await supabase.from("part").select("id").eq("test_id", testId);
        if (existingParts && existingParts.length > 0) {
          const partIds = existingParts.map(p => p.id);
          const { data: existingGroups } = await supabase.from("question").select("id").in("part_id", partIds);
          
          if (existingGroups && existingGroups.length > 0) {
            const groupIds = existingGroups.map(g => g.id);
            // Questions'larni o'chirish
            await supabase.from("questions").delete().in("question_id", groupIds);
            // Groups'larni o'chirish
            await supabase.from("question").delete().in("part_id", partIds);
          }
          // Parts'larni o'chirish
          await supabase.from("part").delete().eq("test_id", testId);
        }
      }
  
      // 3. Parts, Groups va Questions'larni ketma-ket saqlash
      // Global question number counter to ensure sequential numbering across all parts/groups
      let globalQuestionCounter = 1;
      
      for (const partData of parts) {
        const partId = uuidv4();
        const { data: part, error: pErr } = await supabase
          .from("part")
          .insert({
            id: partId,
            test_id: testId,
            part_number: partData.part_number,
            title: partData.title || null,
            content: partData.content || null,
            image_url: partData.image_url || null,
            listening_url: partData.listening_url || null,
          })
          .select().single();
  
        if (pErr) throw pErr;
  
        for (const groupData of partData.question_groups || []) {
          const groupId = uuidv4();
          
          // Calculate question_range for multiple_choice groups
          let questionRange = groupData.question_range || null;
          if (groupData.type === "multiple_choice") {
            questionRange = (groupData.questions || []).length;
          } else if (groupData.type === "fill_in_blanks") {
            questionRange = (groupData.answers || []).length;
          } else if (groupData.type === "drag_drop") {
            // Only count questions with is_correct: true
            questionRange = (groupData.questions || []).filter(q => q.is_correct === true).length;
          } else if (groupData.type === "table") {
            // Count all questions in table matching
            questionRange = (groupData.questions || []).length;
          }
          
          // Determine what to store in question_text at group level
          let groupQuestionText = null;
          if (groupData.type === "multiple_choice") {
            // For multiple_choice, store the main passage/context in group-level question_text
            groupQuestionText = groupData.question_text || null;
          } else if (groupData.type === "fill_in_blanks" || groupData.type === "drag_drop") {
            // For fill_in_blanks and drag_drop, store the content with placeholders
            groupQuestionText = groupData.content || groupData.question_text || null;
          } else if (groupData.type === "table") {
            // For table matching, store column options (A, B, C, D...) in group-level question_text
            if (groupData.options && groupData.options.length > 0) {
              groupQuestionText = groupData.options.join("\n");
            } else if (groupData.question_text) {
              // Fallback: use group-level question_text if options array is not available
              groupQuestionText = groupData.question_text;
            }
          }
          
          // For fill_in_blanks, verify placeholder count matches answers count
          if (groupData.type === "fill_in_blanks") {
            const placeholderRegex = /\[\d+\]/g;
            const placeholdersInText = (groupQuestionText || "").match(placeholderRegex) || [];
            const answersCount = (groupData.answers || []).length;
            
            if (placeholdersInText.length !== answersCount) {
              throw new Error(
                `Fill in blanks validation failed: Found ${placeholdersInText.length} placeholders in text but ${answersCount} answers. ` +
                `Part ${partData.part_number}, Group type: ${groupData.type}`
              );
            }
          }
          
          
          const { data: group, error: gErr } = await supabase
            .from("question")
            .insert({
              id: groupId,
              test_id: testId,
              part_id: part.id,
              type: groupData.type,
              question_range: questionRange,
              instruction: groupData.instruction || null,
              question_text: groupQuestionText, // Main passage for multiple_choice, content for fill_in_blanks/drag_drop
            })
            .select().single();
  
          if (gErr) throw gErr;
  
          // Savollarni (javoblarni) tayyorlash
          let questionsToSave = [];

          if (groupData.type === "fill_in_blanks") {
            // "fill_in_blanks" uchun answers massividan foydalanamiz
            // Extract placeholder numbers from question_text to ensure correct mapping
            const placeholderRegex = /\[(\d+)\]/g;
            const passageText = groupData.content || groupData.question_text || "";
            const placeholderMatches = [...passageText.matchAll(placeholderRegex)];
            
            // Map answers to their corresponding placeholder numbers
            // The placeholders in text should match the sequential question numbers
            questionsToSave = (groupData.answers || []).map((answer, idx) => {
              // Use the placeholder number from text if available, otherwise use global counter
              const placeholderNumber = placeholderMatches[idx] 
                ? parseInt(placeholderMatches[idx][1]) 
                : globalQuestionCounter + idx;
              
              return {
                question_number: placeholderNumber,
                correct_answer: answer || "", // Note: DB column is 'correct_answer', not 'correct_answers'
              };
            });
            
            // Verify all placeholders have corresponding answers
            if (placeholderMatches.length !== questionsToSave.length) {
              throw new Error(
                `Fill in blanks mapping error: ${placeholderMatches.length} placeholders found but ${questionsToSave.length} answers provided. ` +
                `Part ${partData.part_number}`
              );
            }
            
            globalQuestionCounter += groupData.answers.length;
          } else if (groupData.type === "drag_drop") {
            // For drag_drop, separate correct answers from distractors
            const correctAnswers = (groupData.questions || []).filter(q => q.is_correct === true);
            const distractors = (groupData.questions || []).filter(q => q.is_correct === false);
            
            // Save correct answers with question_number
            const correctQuestionsToSave = correctAnswers.map((q, idx) => {
              const sequentialNumber = (q.question_number && q.question_number > 0) 
                ? q.question_number 
                : globalQuestionCounter + idx;
              
              return {
                question_number: sequentialNumber,
                question_text: q.question_text || null,
                correct_answer: q.correct_answer || "",
                explanation: q.explanation || null,
                is_correct: true,
              };
            });
            
            // Save distractors with question_number: null and is_correct: false
            const distractorQuestionsToSave = distractors.map((q) => ({
              question_number: null, // Distractors have null question_number
              question_text: q.question_text || null,
              correct_answer: q.correct_answer || "",
              explanation: q.explanation || null,
              is_correct: false,
            }));
            
            questionsToSave = [...correctQuestionsToSave, ...distractorQuestionsToSave];
            globalQuestionCounter += correctAnswers.length; // Only count correct answers
          } else if (groupData.type === "table") {
            // For table matching:
            // - Group-level question_text contains column options (A, B, C, D...) separated by newlines
            // - Question-level question_text contains the question description
            // - correct_answer contains the selected letter (or null if not selected)
            // - is_correct: true if correct_answer is set, false otherwise
            questionsToSave = (groupData.questions || []).map((q, idx) => {
              const sequentialNumber = (q.question_number && q.question_number > 0) 
                ? q.question_number 
                : globalQuestionCounter + idx;
              
              // question_text contains the question description (not column options)
              const questionText = q.question_text || null;
              
              // correct_answer is the selected letter (A, B, C, D...)
              const correctAnswer = q.correct_answer || null;
              
              // is_correct: true if answer is selected, false otherwise
              const isCorrect = correctAnswer ? true : false;
              
              return {
                question_number: sequentialNumber,
                question_text: questionText, // Question description
                correct_answer: correctAnswer, // Selected letter or null
                explanation: q.explanation || null,
                is_correct: isCorrect,
              };
            });
            globalQuestionCounter += groupData.questions.length;
          } else {
            // "multiple_choice", "true_false_not_given"
            // Use the question_number from the UI (which should already be globally sequential)
            // Use global counter as fallback to ensure sequential numbering
            questionsToSave = (groupData.questions || []).map((q, idx) => {
              // Prefer UI's question_number if valid, otherwise use global counter
              // This ensures sequential numbering even if UI state is inconsistent
              const sequentialNumber = (q.question_number && q.question_number > 0) 
                ? q.question_number 
                : globalQuestionCounter + idx;
              
              // For multiple_choice, correct_answer is already stored as text (not letter)
              // No conversion needed - CardMultipleChoice now stores the option text directly
              let correctAnswerText = q.correct_answer || "";
              
              return {
                question_number: sequentialNumber,
                question_text: q.question_text || null,
                correct_answer: correctAnswerText,
                explanation: q.explanation || null,
              };
            });
            globalQuestionCounter += groupData.questions.length;
          }
  
          if (questionsToSave.length > 0) {
            const qsToInsert = questionsToSave.map(q => ({
              id: uuidv4(),
              test_id: testId,
              question_id: group.id,
              part_id: part.id,
              question_number: q.question_number,
              question_text: q.question_text || null,
              correct_answer: q.correct_answer !== undefined && q.correct_answer !== null ? q.correct_answer : (q.correct_answers || null), // Support both field names, allow null for table type
              explanation: q.explanation || null,
              is_correct: q.is_correct !== undefined ? q.is_correct : true, // Default to true for backward compatibility
            }));
            
            const { error: qsErr } = await supabase.from("questions").insert(qsToInsert);
            if (qsErr) throw qsErr;
          }
        }
      }
  
      set({ loading: false });
      toast.success(`Test successfully ${id ? "updated" : "created"}`);
      return true;
    } catch (error) {
      set({ error: error.message, loading: false });
      toast.error(`Error: ${error.message}`);
      console.error("Full save error:", error.message);
      return false;
    }
  },
}));
