// "How to play" copy for every learning tool, shown from the tool picker's ⓘ
// buttons (not inside the games themselves). Keys are the picker activity ids.
export const TOOL_HELP = {
  quiz: {
    what: "Multiple-choice questions about this lesson.",
    steps: ["Read the question.", "Pick the answer you think is right — you get instant feedback and an explanation.", "Use the arrows to move between questions."],
    win: "Score a point for each correct answer; the results screen shows your total and stars.",
    learn: "Checks what you remember and corrects misconceptions straight away.",
  },
  true_false: {
    what: "Statements from the lesson that are either facts or myths.",
    steps: ["Read each statement.", "Choose Fact or Myth.", "Read the explanation that appears."],
    win: "Get as many right as you can; your score appears when every statement is answered.",
    learn: "Helps you spot common misconceptions.",
  },
  sorting: {
    what: "Cards that belong in different groups.",
    steps: ["Drag a card into the group it belongs to — or tap the card, then tap the group.", "Move cards again if you change your mind.", "Press the check button to see which cards are right."],
    win: "Finish when every card is in the correct group.",
    learn: "Builds understanding of how lesson ideas are categorised.",
  },
  ordering: {
    what: "Steps or events from the lesson in a shuffled order.",
    steps: ["Drag cards up or down — or tap one card, then tap where it goes. The arrows work too.", "Press the check button.", "Fix any cards marked red."],
    win: "Finish when every card is in the right position.",
    learn: "Helps you remember processes and sequences.",
  },
  fill_blank: {
    what: "Sentences with a key word missing.",
    steps: ["Type the missing word into each blank.", "Press the check button.", "Red blanks show the correct answer."],
    win: "Fill every blank correctly.",
    learn: "Practises recalling exact terms, not just recognising them.",
  },
  crossword: {
    what: "An interlocking word grid built from lesson terms.",
    steps: ["Read a numbered clue (across or down).", "Type the answer into the matching squares.", "Press the check button to see right and wrong letters."],
    win: "Complete the whole grid correctly.",
    learn: "Reinforces key vocabulary and its meaning.",
  },
  hangman: {
    what: "Guess a hidden lesson keyword from its clue.",
    steps: ["Read the clue.", "Tap letters to guess — right letters fill in the word.", "Each wrong letter costs a heart."],
    win: "Reveal the whole word before you lose all 6 hearts.",
    learn: "Links keywords to their definitions.",
  },
  unscramble: {
    what: "A lesson term with its letters mixed up.",
    steps: ["Read the clue.", "Rearrange the letter tiles in your head.", "Type the word in the box."],
    win: "Type the correct word for each clue.",
    learn: "Strengthens spelling and recall of key terms.",
  },
  word_search: {
    what: "Lesson terms hidden in a grid of letters.",
    steps: ["Find a word from the list in the grid.", "Tap its first letter, then its last letter.", "Words can run forwards or backwards."],
    win: "Find every word in the list.",
    learn: "Familiarises you with key vocabulary.",
  },
  matching: {
    what: "Terms on the left, definitions on the right.",
    steps: ["Drag from a term's dot to its definition's dot — or tap a term, then a definition.", "Tap a linked term to undo its line.", "Press the check button: green lines are right, red are wrong."],
    win: "Link every term to its correct definition.",
    learn: "Connects lesson terms with what they mean.",
  },
  branching_story: {
    what: "A short story where you play a character and your choices change what happens.",
    steps: ["Read the situation.", "Pick what your character does — each choice leads somewhere different.", "Read the feedback to see the consequence and the lesson idea behind it.", "Reach an ending, then try another path to compare."],
    win: "There is no single right path; the ending shows how well your choices applied the lesson.",
    learn: "Practises applying the lesson to realistic decisions.",
  },
  simulation: {
    what: "A role-play where you manage limited resources over several rounds.",
    steps: ["Each round, pick one decision.", "Every decision changes your resources by the amounts shown.", "Decisions that would push a resource below its minimum are locked."],
    win: "Finish the last round with the goal resource at or above its target.",
    learn: "Shows the trade-offs behind real decisions in the lesson.",
  },
  two_truths_lie: {
    what: "Rounds of three statements: two are true, one is false.",
    steps: ["Read all three statements.", "Pick the one you think is the lie.", "Read the explanation, then go to the next round."],
    win: "Score a point for each lie you find.",
    learn: "Sharpens your eye for incorrect claims.",
  },
  flashcards: {
    what: "Cards with a question on the front and the answer on the back.",
    steps: ["Read the question and try to recall the answer.", "Tap the card (or press Space) to flip it.", "Choose Got it or Still learning."],
    win: "Review every card; the results show how many you know.",
    learn: "Builds memory through active recall.",
  },
  speed_flashcards: {
    what: "Flashcards against a timer.",
    steps: ["Start the timer.", "Recall the answer before time runs out, then flip the card.", "Choose Got it or Still learning — the next card starts."],
    win: "Recall as many cards as you can; the results show your total.",
    learn: "Trains quick, confident recall for the exam.",
  },
}

