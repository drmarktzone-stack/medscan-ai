import React, { useState } from 'react';

const KEYS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
];

function compute(a, b, op) {
  const x = parseFloat(a);
  const y = parseFloat(b);
  switch (op) {
    case '+': return x + y;
    case '-': return x - y;
    case '×': return x * y;
    case '÷': return y === 0 ? 'Error' : x / y;
    default: return y;
  }
}

export default function CalculatorApp() {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState(null);
  const [op, setOp] = useState(null);
  const [fresh, setFresh] = useState(true);

  function press(key) {
    if (key === 'C') {
      setDisplay('0');
      setPrev(null);
      setOp(null);
      setFresh(true);
      return;
    }
    if (key === '±') {
      setDisplay(String(parseFloat(display) * -1));
      return;
    }
    if (key === '%') {
      setDisplay(String(parseFloat(display) / 100));
      return;
    }
    if (['+', '-', '×', '÷'].includes(key)) {
      setPrev(display);
      setOp(key);
      setFresh(true);
      return;
    }
    if (key === '=') {
      if (prev != null && op) {
        const result = compute(prev, display, op);
        setDisplay(String(result));
        setPrev(null);
        setOp(null);
        setFresh(true);
      }
      return;
    }
    if (key === '.') {
      if (fresh) {
        setDisplay('0.');
        setFresh(false);
      } else if (!display.includes('.')) {
        setDisplay(`${display}.`);
      }
      return;
    }
    if (fresh) {
      setDisplay(key);
      setFresh(false);
    } else {
      setDisplay(display === '0' ? key : display + key);
    }
  }

  return (
    <div className="p-4 bg-black min-h-[calc(100vh-44px)] text-white">
      <div className="text-right text-5xl font-light py-8 truncate">{display}</div>
      <div className="grid grid-cols-4 gap-2">
        {KEYS.flat().map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => press(key)}
            className={`h-16 rounded-full text-xl font-medium active:opacity-70 ${
              ['+', '-', '×', '÷', '='].includes(key)
                ? 'bg-[#ff9f0a] text-white'
                : ['C', '±', '%'].includes(key)
                  ? 'bg-[#a5a5a5] text-black'
                  : 'bg-[#333] text-white'
            } ${key === '0' ? 'col-span-2 w-full rounded-full' : ''}`}
            style={key === '0' ? { gridColumn: 'span 2' } : undefined}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
}
