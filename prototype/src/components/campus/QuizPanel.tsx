import { useState } from 'react';
import { useToast } from '../../hooks/useToast';
import type { Quiz } from '../../types/campus';
import { QUIZ_XP } from '../../utils/passport';

export function QuizPanel({ quiz, done, onCorrect }: { quiz: Quiz; done: boolean; onCorrect: () => void }) {
  const toast = useToast();
  const [wrong, setWrong] = useState<number[]>([]);
  const answer = (i: number) => {
    if (i === quiz.answer) {
      onCorrect();
    } else {
      setWrong((list) => [...list, i]);
      toast('Not quite. Read the panel and try again.');
    }
  };
  return (
    <>
      <p className="quiz-q">{done ? `Quiz complete · ${quiz.q}` : `Bonus quiz · +${QUIZ_XP} XP: ${quiz.q}`}</p>
      {quiz.options.map((o, i) => {
        const classes = ['quiz-o', done && i === quiz.answer && 'right', wrong.includes(i) && !done && 'wrong'].filter(Boolean).join(' ');
        return <button key={o} className={classes} disabled={done || wrong.includes(i)} onClick={() => answer(i)}>{o}</button>;
      })}
    </>
  );
}
