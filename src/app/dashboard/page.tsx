"use client";

import { useState, useEffect } from "react";

type ArrayItem = {
  value: number;
  state: "default" | "comparing" | "swapped";
};

type Step = {
  array: ArrayItem[];
};

export default function ArraySortVisualizer() {
  const [inputValue, setInputValue] = useState("");
  const [array, setArray] = useState<ArrayItem[]>([]);
  const [sortMethod, setSortMethod] = useState("Пузырьковая");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [jsonData, setJsonData] = useState({ array: [] as number[], method: sortMethod });

  function parseArray(input: string): number[] | null {
    if (input.trim().length === 0) return [];
    const parts = input.split(/[\s,]+/).map((x) => x.trim());
    const nums: number[] = [];
    for (let p of parts) {
      if (p === "") continue;
      const n = Number(p);
      if (!Number.isInteger(n)) return null;
      nums.push(n);
    }
    return nums;
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setInputValue(e.target.value);
  }

  function generateArrayItems(nums: number[]): ArrayItem[] {
    return nums.map((n) => ({ value: n, state: "default" }));
  }

  const sortingAlgorithms: { [key: string]: (arr: ArrayItem[]) => Step[] } = {
    "Пузырьковая": bubbleSortWithSteps,
    "Вставками": insertionSortWithSteps,
    "Выбором": selectionSortWithSteps,
  };

  function bubbleSortWithSteps(arr: ArrayItem[]): Step[] {
    const steps: Step[] = [];
    const arrayCopy = arr.map((a) => ({ ...a }));
    const n = arrayCopy.length;
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        arrayCopy[j].state = "comparing";
        arrayCopy[j + 1].state = "comparing";
        steps.push({ array: arrayCopy.map((a) => ({ ...a })) });

        if (arrayCopy[j].value > arrayCopy[j + 1].value) {
          [arrayCopy[j], arrayCopy[j + 1]] = [arrayCopy[j + 1], arrayCopy[j]];
          arrayCopy[j].state = "swapped";
          arrayCopy[j + 1].state = "swapped";
          steps.push({ array: arrayCopy.map((a) => ({ ...a })) });
        }

        arrayCopy[j].state = "default";
        arrayCopy[j + 1].state = "default";
      }
    }
    return steps;
  }

  function insertionSortWithSteps(arr: ArrayItem[]): Step[] {
    const steps: Step[] = [];
    const arrayCopy = arr.map((a) => ({ ...a }));
    for (let i = 1; i < arrayCopy.length; i++) {
      let key = arrayCopy[i].value;
      let j = i - 1;
      while (j >= 0 && arrayCopy[j].value > key) {
        arrayCopy[j].state = "comparing";
        arrayCopy[j + 1].value = arrayCopy[j].value;
        arrayCopy[j].state = "default";
        steps.push({ array: arrayCopy.map((a) => ({ ...a })) });
        j--;
      }
      arrayCopy[j + 1].value = key;
      steps.push({ array: arrayCopy.map((a) => ({ ...a, state: "swapped" })) });
      arrayCopy.forEach((a) => (a.state = "default"));
    }
    return steps;
  }

  function selectionSortWithSteps(arr: ArrayItem[]): Step[] {
    const steps: Step[] = [];
    const arrayCopy = arr.map((a) => ({ ...a }));
    const n = arrayCopy.length;
    for (let i = 0; i < n - 1; i++) {
      let minIdx = i;
      for (let j = i + 1; j < n; j++) {
        arrayCopy[j].state = "comparing";
        steps.push({ array: arrayCopy.map((a) => ({ ...a })) });
        if (arrayCopy[j].value < arrayCopy[minIdx].value) minIdx = j;
        arrayCopy[j].state = "default";
      }
      [arrayCopy[i], arrayCopy[minIdx]] = [arrayCopy[minIdx], arrayCopy[i]];
      arrayCopy[i].state = "swapped";
      arrayCopy[minIdx].state = "swapped";
      steps.push({ array: arrayCopy.map((a) => ({ ...a })) });
      arrayCopy.forEach((a) => (a.state = "default"));
    }
    return steps;
  }

  function startSort() {
    const nums = parseArray(inputValue);
    if (!nums) {
      alert("Некорректный ввод массива");
      return;
    }

    const initialArray = generateArrayItems(nums);
    setArray(initialArray);

    const startTime = performance.now();
    const generatedSteps = sortingAlgorithms[sortMethod](initialArray);
    const endTime = performance.now();

    setDuration(endTime - startTime);
    setSteps(generatedSteps);
    setCurrentStep(0);
    setRunning(true);
  }

  // Автоматически обновляем JSON при изменении массива или метода сортировки
  useEffect(() => {
    setJsonData({
      array: array.map((item) => item.value),
      method: sortMethod,
    });
  }, [array, sortMethod]);

  useEffect(() => {
    if (!running || currentStep >= steps.length) {
      setRunning(false);
      return;
    }

    const timer = setTimeout(() => {
      setArray(steps[currentStep].array);
      setCurrentStep((prev) => prev + 1);
    }, 300);

    return () => clearTimeout(timer);
  }, [currentStep, running, steps]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6 space-y-4">
        <h2 className="text-xl font-semibold">Визуализация сортировки массива</h2>

        <input
          type="text"
          placeholder="Введите массив, например: 5 3 8 1"
          value={inputValue}
          onChange={handleInputChange}
          className="w-full rounded-lg border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-gray-700">Метод сортировки</legend>
          {Object.keys(sortingAlgorithms).map((method) => (
            <label key={method} className="flex items-center gap-2">
              <input
                type="radio"
                name="sortMethod"
                value={method}
                checked={sortMethod === method}
                onChange={(e) => setSortMethod(e.target.value)}
              />
              {method}
            </label>
          ))}
        </fieldset>

        <button
          onClick={startSort}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          Начать сортировку
        </button>

        <div className="flex gap-2 flex-wrap mt-4">
          {array.map((item, idx) => (
            <div
              key={idx}
              className={`h-12 w-12 flex items-center justify-center border text-white font-bold ${
                item.state === "comparing"
                  ? "bg-red-500"
                  : item.state === "swapped"
                  ? "bg-green-500"
                  : "bg-gray-400"
              } transition-all duration-300`}
            >
              {item.value}
            </div>
          ))}
        </div>

        {duration && (
          <p className="mt-2 text-sm text-gray-700">
            Длительность сортировки: {duration.toFixed(3)} мс
          </p>
        )}

        {/*<pre className="mt-4 bg-gray-100 p-4 rounded-lg w-full overflow-x-auto">
          {JSON.stringify(jsonData, null, 2)}
        </pre>*/}
      </div>
    </div>
  );
}
