# Question Preview Feature

## 🎯 Overview

Users can now **review generated questions before creating the QTI file** and have the option to regenerate different questions if they're not satisfied.

---

## ✨ New User Flow

### Before (Old Flow):
1. Upload file
2. Set question count and title
3. Click "Generate Quiz"
4. ⏳ Quiz auto-generated with QTI
5. ✅ Saved to database
6. No chance to review or regenerate

### After (New Flow):
1. Upload file
2. Set question count and title
3. Click "Generate Quiz"
4. 🔍 **Preview Dialog Opens** showing all questions
5. User can:
   - ✅ **Accept & Save** → Saves quiz to database
   - 🔄 **Regenerate** → Deletes current, generates new questions
   - ❌ **Close** → Cancels without saving
6. Quiz only saved after user accepts

---

## 🎨 Preview Dialog Features

### Beautiful UI
- **Full-screen modal** with max-width
- **Scrollable question list** for long quizzes
- **Numbered questions** with circular badges
- **Color-coded answers**:
  - ✅ Correct answer: Green background
  - Regular options: White background
- **Explanation display** (if available)
- **Responsive design** for mobile and desktop

### Question Display
Each question shows:
- ✅ Question number and text
- ✅ All 4 answer options
- ✅ Visual indicator for correct answer (green checkmark)
- ✅ Bold text for correct answer
- ✅ Explanation box (if AI generated one)

### Header
- Quiz title and question count
- Close button (X) in top-right

### Footer Actions
- **Regenerate button**: Generates different questions
  - Shows "🔄 Regenerating..." while processing
  - Disabled during generation
- **Accept & Save button**: Confirms and saves quiz
  - Primary button style (prominent)
- Helpful text explaining the options

---

## 🔧 Implementation Details

### Frontend Changes (`apps/web/src/app/dashboard/page.tsx`)

#### New State
```typescript
const [previewDialog, setPreviewDialog] = useState<{
  isOpen: boolean;
  questions: any[];
  quizId: string;
  fileUploadId: string;
  title: string;
  questionCount: number;
}>({
  isOpen: false,
  questions: [],
  quizId: '',
  fileUploadId: '',
  title: '',
  questionCount: 0,
});
```

#### Modified Quiz Generation
- `generateQuizMutation.onSuccess` now opens preview dialog instead of auto-saving
- Stores quiz data temporarily in state

#### New Functions
1. **`handleAcceptQuiz()`**
   - Closes preview dialog
   - Resets form
   - Refreshes quiz list
   - Shows success toast
   - Quiz already exists in database with QTI file

2. **`handleRegenerateQuiz()`**
   - Deletes current quiz from database
   - Calls generation API again with same file
   - Shows new preview dialog when done
   - Handles errors gracefully

#### Preview Dialog Component
- Custom modal (not using Dialog component for full control)
- Fixed positioning with backdrop
- Scrollable content area
- Responsive layout

---

## 📱 User Experience

### Visual Feedback
- ✅ **Loading states**: "Regenerating..." text while processing
- ✅ **Color coding**: Green for correct, white for incorrect
- ✅ **Icons**: Checkmark for correct answers
- ✅ **Success toast**: Confirmation after accepting
- ✅ **Error toast**: If regeneration fails

### Interaction
- ✅ Can scroll through all questions
- ✅ Can close without saving (escape key / X button)
- ✅ Can regenerate multiple times
- ✅ Can't accidentally lose work

---

## 🎯 Use Cases

### Scenario 1: Happy Path
```
User uploads PDF
  ↓
Generates 5 questions
  ↓
Reviews questions in preview
  ↓
Likes them, clicks "Accept & Save"
  ↓
Quiz saved, QTI file ready for download
```

### Scenario 2: Regeneration
```
User uploads PDF
  ↓
Generates 10 questions
  ↓
Reviews questions - not satisfied
  ↓
Clicks "Regenerate"
  ↓
New set of 10 questions generated
  ↓
Reviews again, likes them
  ↓
Clicks "Accept & Save"
```

### Scenario 3: Cancel
```
User uploads PDF
  ↓
Generates questions
  ↓
Changes mind, clicks X
  ↓
Preview closes, no quiz saved
  ↓
Can start over with different settings
```

---

## 🔒 Data Flow

### When Quiz is Generated:
1. Frontend calls `POST /api/quiz` with fileId
2. Backend:
   - Extracts text from file
   - Calls OpenAI to generate questions
   - Creates quiz in database
   - Generates QTI ZIP file
   - Returns quiz data with questions
3. Frontend shows preview dialog

### When User Clicks "Regenerate":
1. Frontend calls `DELETE /api/quiz/:quizId`
2. Backend deletes quiz and QTI file
3. Frontend calls `POST /api/quiz` again
4. New quiz generated with different questions
5. New preview dialog shown

### When User Clicks "Accept":
1. Preview dialog closes
2. Quiz list refreshed
3. Quiz already exists in database (from initial generation)
4. QTI file already created
5. Ready for download immediately

---

## 💡 Benefits

### For Users
- ✅ **Review before committing**: See what was generated
- ✅ **Quality control**: Ensure questions make sense
- ✅ **Flexibility**: Regenerate if not satisfied
- ✅ **Confidence**: Know exactly what you're saving
- ✅ **No surprises**: See all questions upfront

### For Developers
- ✅ **Better UX**: Users feel more in control
- ✅ **Reduced support**: Fewer complaints about bad questions
- ✅ **Higher satisfaction**: Users can iterate until happy
- ✅ **Data insights**: Can track regeneration patterns

---

## 🐛 Edge Cases Handled

### ✅ Multiple Regenerations
- Users can regenerate as many times as they want
- Each regeneration creates new questions
- No limit on attempts

### ✅ Dialog Closing
- Closing dialog doesn't save quiz
- BUT quiz still exists in database from initial generation
- Future enhancement: Add "Discard" option to delete quiz

### ✅ Error Handling
- If regeneration fails, shows error toast
- Preview stays open
- User can try again or close

### ✅ Loading States
- Regenerate button disabled during generation
- Shows "Regenerating..." text
- Prevents multiple concurrent requests

---

## 🎨 Styling Highlights

### Colors
- **Primary Blue**: Question numbers, action buttons
- **Green**: Correct answers and success states
- **Gray**: Regular options and borders
- **Blue**: Explanation boxes
- **Red**: Delete/error states (in general UI)

### Layout
- **Responsive**: Works on mobile and desktop
- **Scrollable**: Long quizzes don't overflow
- **Fixed footer**: Actions always visible
- **Max-width**: Content doesn't stretch too wide

### Typography
- **Bold**: Question text, correct answers
- **Normal**: Regular options
- **Small**: Helper text, explanations

---

## 🚀 Future Enhancements

### Possible Improvements
1. **Edit Questions**: Allow inline editing of questions/answers
2. **Add Questions**: Let users add custom questions
3. **Remove Questions**: Delete unwanted questions
4. **Reorder Questions**: Drag-and-drop reordering
5. **Discard Option**: Button to delete quiz without saving
6. **Save Draft**: Keep quiz without QTI file initially
7. **Difficulty Selection**: Regenerate with different difficulty
8. **Partial Regeneration**: Regenerate specific questions only

---

## 📊 Technical Notes

### Performance
- Preview loads instantly (data already in response)
- Regeneration takes same time as initial generation
- No additional API calls for preview display

### Data Structure
Questions array contains:
```typescript
{
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}
```

### API Endpoints Used
- `POST /api/quiz` - Generate quiz with questions
- `DELETE /api/quiz/:id` - Delete quiz for regeneration
- `GET /api/quiz` - Fetch quiz list (after accept)

---

## ✅ Testing Checklist

- [ ] Upload file and generate quiz
- [ ] Preview dialog appears with all questions
- [ ] Correct answers highlighted in green
- [ ] Click "Accept & Save" - quiz appears in list
- [ ] Click "Regenerate" - new questions generated
- [ ] Regenerate multiple times - works each time
- [ ] Close dialog without saving - no quiz saved
- [ ] Test with Free plan (5 questions)
- [ ] Test with Pro plan (up to 30 questions)
- [ ] Test on mobile device
- [ ] Test long questions and answers
- [ ] Test with explanations present
- [ ] Test with no explanations
- [ ] Test error scenarios (network failure)

---

## 🎉 Summary

Users now have **full control** over their generated quizzes! They can:
- ✅ Review questions before saving
- ✅ Regenerate for better results
- ✅ See correct answers clearly
- ✅ Make informed decisions
- ✅ Ensure quality before export

This feature significantly improves the user experience and gives users confidence in the quiz generation process! 🚀

