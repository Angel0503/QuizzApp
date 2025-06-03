import React, { useState } from "react";
import type { ChangeEvent } from "react";
import "./App.css";

//TODO : ADJECTIF ORDRE MARCHE PAS sur la premiere question
// voir pk

// === Types ===
type Question =
  | {
    type: "qcm";
    question: string;
    options: string[];
    answer: string;
  }
  | {
    type: "vocab";
    question: string;
    answer: string;
  }
  | {
    type: "adjectif-order";
    question: string;
    answer: string[];
  }
  | {
    type: "conditionnel";
    question: string;
    answer: string;
    degree: "0" | "1" | "2" | "3";
  };

type QuizData = Record<string, Question[]>;

// === Composants UI ===
type ButtonProps = React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>;
const Button = ({ children, className = "", ...props }: ButtonProps) => (
  <button className={`py-2 px-4 rounded font-semibold transition-colors ${className}`} {...props}>
    {children}
  </button>
);

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;
const Input = (props: InputProps) => (
  <input className="border border-gray-300 rounded px-3 py-2 w-full" {...props} />
);

type CardProps = React.PropsWithChildren;
const Card = ({ children }: CardProps) => (
  <div className="border rounded-lg shadow-md p-4 bg-white">{children}</div>
);

type CardContentProps = React.PropsWithChildren<{ className?: string }>;
const CardContent = ({ children, className }: CardContentProps) => (
  <div className={className}>{children}</div>
);

// === Fonctions utilitaires ===
function shuffleArray<T>(array: T[]): T[] {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

// === Composant principal ===
export default function App() {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showCorrection, setShowCorrection] = useState<boolean>(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[] | null>(null);
  const [shuffledAdjectives, setShuffledAdjectives] = useState<string[]>([]);
  const [orderedAdjectives, setOrderedAdjectives] = useState<string[]>([]);
  const [step, setStep] = useState<"answer" | "degree">("answer");
  const [degreeAnswer, setDegreeAnswer] = useState<string | null>(null);

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setQuizData(json);
      } catch {
        alert("Fichier JSON invalide");
      }
    };
    reader.readAsText(file);
  };

  const handleAnswer = (answer: string) => {
    if (!quizData || !selectedTheme || !shuffledQuestions) return;
    if (showCorrection) return;

    setSelectedAnswer(answer);
    setShowCorrection(true);

    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    const isCorrect =
      currentQuestion.type === "vocab"
        ? answer.trim().toLowerCase() === currentQuestion.answer.trim().toLowerCase()
        : answer === currentQuestion.answer;

    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (!quizData || !selectedTheme || !shuffledQuestions) return;

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < shuffledQuestions.length) {
      setCurrentQuestionIndex(nextIndex);
      setSelectedAnswer(null);
      setShowCorrection(false);
      setShuffledAdjectives([]);
      setOrderedAdjectives([]);
      setStep("answer");
      setDegreeAnswer(null);

      const nextQuestion = shuffledQuestions[nextIndex];
      if (nextQuestion.type === "adjectif-order") {
        setShuffledAdjectives(shuffleArray(nextQuestion.answer));
      }
    } else {
      setShowResults(true);
    }
  };

  const resetQuiz = () => {
    setSelectedTheme(null);
    setCurrentQuestionIndex(0);
    setShowResults(false);
    setScore(0);
    setSelectedAnswer(null);
    setShowCorrection(false);
    setShuffledQuestions(null);
    setShuffledAdjectives([]);
    setOrderedAdjectives([]);
    setStep("answer");
    setDegreeAnswer(null);
  };

  const validateAdjectiveOrder = () => {
    if (!shuffledQuestions) return;
    const currentQuestion = shuffledQuestions[currentQuestionIndex];
    if (currentQuestion.type !== "adjectif-order") return;

    const userAnswer = orderedAdjectives.join(" ").trim().toLowerCase();
    const correctAnswer = currentQuestion.answer.join(" ").trim().toLowerCase();

    const isCorrect = userAnswer === correctAnswer;

    setShowCorrection(true);
    if (isCorrect) setScore((prev) => prev + 1);
  };

  if (!quizData) {
    return (
      <div className="p-6 max-w-xl mx-auto space-y-4">
        <h2 className="text-xl font-bold">Importer un fichier JSON de quiz</h2>
        <Input type="file" accept="application/json" onChange={handleFileUpload} />
      </div>
    );
  }

  if (!selectedTheme) {
    return (
      <div className="p-6 max-w-xl mx-auto space-y-4">
        <h2 className="text-xl font-bold">Choisissez un thème</h2>
        {Object.keys(quizData).map((theme) => (
          <Button
            key={theme}
            onClick={() => {
              setSelectedTheme(theme);
              const questions = quizData[theme];
              setShuffledQuestions(shuffleArray(questions));
              if (questions[0].type === "adjectif-order") {
                setShuffledAdjectives(shuffleArray(questions[0].answer));
              }
            }}
          >
            {theme}
          </Button>
        ))}
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="p-6 max-w-xl mx-auto space-y-4">
        <h2 className="text-xl font-bold">Résultats</h2>
        <p>
          Score: {score} / {shuffledQuestions!.length}
        </p>
        <Button onClick={resetQuiz}>Choisir un nouveau thème</Button>
      </div>
    );
  }

  const currentQuestion = shuffledQuestions![currentQuestionIndex];

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-4">
        <Button className="bg-gray-200 text-black hover:bg-gray-300" onClick={resetQuiz}>
          ← Retour au choix du thème
        </Button>
      </div>
      <Card>
        <CardContent className="space-y-4">
          <h2 className="text-lg font-semibold">{currentQuestion.question}</h2>

          {/* TYPE : adjectif-order */}
          {currentQuestion.type === "adjectif-order" && (
            <>
              <div className="border border-gray-300 p-3 rounded min-h-[40px] flex flex-wrap gap-2">
                {orderedAdjectives.map((adj, index) => (
                  <Button
                    key={`chosen-${index}`}
                    className="bg-blue-500 text-white"
                    onClick={() =>
                      setOrderedAdjectives((prev) =>
                        prev.filter((_, i) => i !== index)
                      )
                    }
                  >
                    {adj} ✕
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {shuffledAdjectives
                  .filter((adj) => !orderedAdjectives.includes(adj))
                  .map((adj, i) => (
                    <Button
                      key={`option-${i}`}
                      className="bg-gray-200"
                      onClick={() => setOrderedAdjectives((prev) => [...prev, adj])}
                      disabled={showCorrection}
                    >
                      {adj}
                    </Button>
                  ))}
              </div>
              <Button
                className="bg-blue-500 text-white"
                onClick={validateAdjectiveOrder}
                disabled={
                  showCorrection ||
                  orderedAdjectives.length !== currentQuestion.answer.length
                }
              >
                Valider
              </Button>
              {showCorrection && (
                <div className="mt-4 text-sm">
                  {orderedAdjectives.join(" ") === currentQuestion.answer.join(" ") ? (
                    <p className="text-green-600 font-semibold">Bonne réponse !</p>
                  ) : (
                    <>
                      <p className="text-red-600 font-semibold">Mauvaise réponse.</p>
                      <p>
                        Bonne réponse : <strong>{currentQuestion.answer.join(", ")}</strong>
                      </p>
                    </>
                  )}
                  <div className="pt-4">
                    <Button onClick={handleNext}>Suivant</Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TYPE : conditionnel */}
          {currentQuestion.type === "conditionnel" && (
            <>
              {step === "answer" && (
                <>
                  <Input
                    type="text"
                    placeholder="Complétez la phrase"
                    value={selectedAnswer || ""}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    disabled={showCorrection}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && selectedAnswer) {
                        setStep("degree");
                      }
                    }}
                  />
                  <Button
                    className="bg-blue-500 text-white hover:bg-blue-600"
                    onClick={() => {
                      if (!selectedAnswer) return;
                      const correct =
                        selectedAnswer.trim().toLowerCase() === currentQuestion.answer.toLowerCase();
                      if (!correct) {
                        setShowCorrection(true);
                      } else {
                        setStep("degree");
                      }
                    }}
                    disabled={showCorrection}
                  >
                    Valider
                  </Button>
                </>
              )}

              {step === "degree" && (
                <>
                  <p className="mt-2">
                    <strong>Bonne réponse :</strong> {currentQuestion.answer}
                  </p>
                  <p className="mt-2">Quel est le degré de ce conditionnel ?</p>
                  <Input
                    type="text"
                    placeholder="Entrez 0, 1, 2 ou 3"
                    value={degreeAnswer || ""}
                    onChange={(e) => setDegreeAnswer(e.target.value)}
                    disabled={showCorrection}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && degreeAnswer) {
                        setShowCorrection(true);
                      }
                    }}
                  />
                  <Button
                    className="bg-blue-500 text-white hover:bg-blue-600 mt-2"
                    onClick={() => {
                      if (!degreeAnswer) return;
                      const correctDegree = degreeAnswer.trim() === currentQuestion.degree;
                      const correctAnswer =
                        selectedAnswer?.trim().toLowerCase() === currentQuestion.answer.toLowerCase();

                      if (correctAnswer && correctDegree) {
                        setScore((prev) => prev + 1);
                      }

                      setShowCorrection(true);
                    }}
                  >
                    Valider
                  </Button>
                </>
              )}


              {showCorrection && (
                <div className="mt-4 text-sm">
                  {selectedAnswer?.trim().toLowerCase() === currentQuestion.answer.toLowerCase() &&
                    degreeAnswer?.trim() === currentQuestion.degree ? (
                    <p className="text-green-600 font-semibold">Bonne réponse !</p>
                  ) : (
                    <>
                      <p className="text-red-600 font-semibold">Mauvaise réponse.</p>
                      <p>
                        Bonne réponse : <strong>{currentQuestion.answer}</strong>
                      </p>
                      <p>
                        Degré : <strong>{currentQuestion.degree}</strong>
                      </p>
                    </>
                  )}
                  <div className="pt-4">
                    <Button onClick={handleNext}>Suivant</Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TYPE : vocab / qcm */}
          {["vocab", "qcm"].includes(currentQuestion.type) && (
            <div className="space-y-2">
              {currentQuestion.type === "qcm" ? (
                currentQuestion.options.map((opt, i) => {
                  let colorClass = "bg-blue-500 text-white hover:bg-blue-600";

                  if (showCorrection) {
                    const isCorrect = opt === currentQuestion.answer;
                    const isSelected = opt === selectedAnswer;

                    if (isCorrect) colorClass = "bg-green-500 text-white";
                    else if (isSelected) colorClass = "bg-red-500 text-white";
                    else colorClass = "bg-gray-300 text-black";
                  }

                  return (
                    <Button
                      key={i}
                      className={`w-full text-left ${colorClass}`}
                      disabled={showCorrection}
                      onClick={() => handleAnswer(opt)}
                    >
                      {opt}
                    </Button>
                  );
                })
              ) : (
                <>
                  <Input
                    type="text"
                    placeholder="Votre réponse"
                    value={selectedAnswer || ""}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    disabled={showCorrection}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && selectedAnswer) {
                        handleAnswer(selectedAnswer);
                      }
                    }}
                  />
                  <Button
                    className="bg-blue-500 text-white hover:bg-blue-600"
                    onClick={() => selectedAnswer && handleAnswer(selectedAnswer)}
                    disabled={showCorrection || !selectedAnswer}
                  >
                    Valider
                  </Button>
                </>
              )}
              {showCorrection && currentQuestion.type === "vocab" && (
                <div className="text-sm text-gray-600">
                  <p>
                    Votre réponse : <strong>{selectedAnswer}</strong>
                  </p>
                  <p>
                    Bonne réponse : <strong>{currentQuestion.answer}</strong>
                  </p>
                </div>
              )}
              {showCorrection && (
                <div className="pt-4">
                  <Button onClick={handleNext}>
                    Suivant
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
