/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Trophy, Play, RotateCcw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap } from 'lucide-react';

// Constants
const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const SPEEDS = {
  SLOW: 150,
  MEDIUM: 100,
  FAST: 60,
};

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [food, setFood] = useState({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(SPEEDS.MEDIUM);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('snakeHighScore');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Save high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('snakeHighScore', score.toString());
    }
  }, [score, highScore]);

  const generateFood = useCallback((currentSnake: { x: number; y: number }[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      // Check if food spawned on snake
      const onSnake = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
    setFood(generateFood(INITIAL_SNAKE));
  };

  const moveSnake = useCallback(() => {
    if (gameOver || !gameStarted || isPaused) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: head.x + direction.x,
        y: head.y + direction.y,
      };

      // Check wall collision
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        setGameOver(true);
        return prevSnake;
      }

      // Check self collision
      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver, gameStarted, isPaused, generateFood]);

  // Game Loop
  useEffect(() => {
    const interval = setInterval(moveSnake, gameSpeed);
    return () => clearInterval(interval);
  }, [moveSnake, gameSpeed]);

  // Keyboard Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      
      if (key === 'arrowup' || key === 'w') {
        if (direction.y === 0) setDirection({ x: 0, y: -1 });
      } else if (key === 'arrowdown' || key === 's') {
        if (direction.y === 0) setDirection({ x: 0, y: 1 });
      } else if (key === 'arrowleft' || key === 'a') {
        if (direction.x === 0) setDirection({ x: -1, y: 0 });
      } else if (key === 'arrowright' || key === 'd') {
        if (direction.x === 0) setDirection({ x: 1, y: 0 });
      } else if (key === ' ') {
        if (gameStarted && !gameOver) setIsPaused(p => !p);
        else if (!gameStarted || gameOver) resetGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, gameStarted, gameOver]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;

    // Clear background
    ctx.fillStyle = '#0f172a'; // Slate 900
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid (subtle)
    ctx.strokeStyle = '#1e293b'; // Slate 800
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // Draw Food
    ctx.fillStyle = '#f43f5e'; // Rose 500
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#f43f5e';
    ctx.beginPath();
    ctx.arc(
      food.x * cellSize + cellSize / 2,
      food.y * cellSize + cellSize / 2,
      cellSize / 2.5,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Snake
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      
      // Create gradient for snake
      const gradient = ctx.createLinearGradient(
        segment.x * cellSize,
        segment.y * cellSize,
        (segment.x + 1) * cellSize,
        (segment.y + 1) * cellSize
      );
      
      if (isHead) {
        gradient.addColorStop(0, '#22c55e'); // Green 500
        gradient.addColorStop(1, '#16a34a'); // Green 600
      } else {
        const opacity = Math.max(0.3, 1 - index / snake.length);
        gradient.addColorStop(0, `rgba(34, 197, 94, ${opacity})`);
        gradient.addColorStop(1, `rgba(22, 163, 74, ${opacity})`);
      }

      ctx.fillStyle = gradient;
      
      // Rounded rectangles for snake body
      const padding = 1;
      const x = segment.x * cellSize + padding;
      const y = segment.y * cellSize + padding;
      const size = cellSize - padding * 2;
      const radius = isHead ? 6 : 4;

      ctx.beginPath();
      ctx.roundRect(x, y, size, size, radius);
      ctx.fill();

      // Draw eyes on head
      if (isHead) {
        ctx.fillStyle = 'white';
        const eyeSize = 2;
        const eyeOffset = cellSize / 4;
        
        // Adjust eye position based on direction
        let leftEye = { x: x + eyeOffset, y: y + eyeOffset };
        let rightEye = { x: x + size - eyeOffset - eyeSize, y: y + eyeOffset };

        if (direction.x === 1) { // Right
          leftEye = { x: x + size - eyeOffset - eyeSize, y: y + eyeOffset };
          rightEye = { x: x + size - eyeOffset - eyeSize, y: y + size - eyeOffset - eyeSize };
        } else if (direction.x === -1) { // Left
          leftEye = { x: x + eyeOffset, y: y + eyeOffset };
          rightEye = { x: x + eyeOffset, y: y + size - eyeOffset - eyeSize };
        } else if (direction.y === 1) { // Down
          leftEye = { x: x + eyeOffset, y: y + size - eyeOffset - eyeSize };
          rightEye = { x: x + size - eyeOffset - eyeSize, y: y + size - eyeOffset - eyeSize };
        }

        ctx.fillRect(leftEye.x, leftEye.y, eyeSize, eyeSize);
        ctx.fillRect(rightEye.x, rightEye.y, eyeSize, eyeSize);
      }
    });

  }, [snake, food, direction]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans">
      {/* Header */}
      <div className="w-full max-w-md flex justify-between items-end mb-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
            SNAKE
          </h1>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Neon Edition</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center justify-end gap-1">
              <Zap size={10} className="text-blue-400" /> Speed
            </p>
            <div className="flex gap-1 mt-1">
              {(Object.keys(SPEEDS) as Array<keyof typeof SPEEDS>).map((level) => (
                <button
                  key={level}
                  onClick={() => setGameSpeed(SPEEDS[level])}
                  className={`px-2 py-0.5 text-[9px] font-bold rounded transition-all ${
                    gameSpeed === SPEEDS[level]
                      ? 'bg-blue-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {level[0]}
                </button>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Score</p>
            <p className="text-2xl font-mono font-bold leading-none">{score}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold flex items-center justify-end gap-1">
              <Trophy size={10} className="text-yellow-500" /> High
            </p>
            <p className="text-2xl font-mono font-bold leading-none text-yellow-500/80">{highScore}</p>
          </div>
        </div>
      </div>

      {/* Game Container */}
      <div className="relative group">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="rounded-xl border-4 border-slate-800 shadow-2xl shadow-green-500/10 max-w-full h-auto"
        />

        {/* Overlays */}
        {(!gameStarted || gameOver || isPaused) && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-lg flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
            {gameOver ? (
              <>
                <h2 className="text-5xl font-black text-rose-500 mb-2 italic">GAME OVER</h2>
                <p className="text-slate-400 mb-8">Final Score: {score}</p>
                <button
                  onClick={resetGame}
                  className="group flex items-center gap-2 bg-green-500 hover:bg-green-400 text-slate-950 px-8 py-4 rounded-full font-bold transition-all hover:scale-105 active:scale-95"
                >
                  <RotateCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
                  RETRY
                </button>
              </>
            ) : isPaused ? (
              <>
                <h2 className="text-5xl font-black text-yellow-500 mb-8 italic">PAUSED</h2>
                <button
                  onClick={() => setIsPaused(false)}
                  className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 px-8 py-4 rounded-full font-bold transition-all hover:scale-105 active:scale-95"
                >
                  <Play size={20} />
                  RESUME
                </button>
              </>
            ) : (
              <>
                <div className="mb-8 space-y-2">
                  <h2 className="text-5xl font-black text-green-500 italic">READY?</h2>
                  <p className="text-slate-400 text-sm">Use WASD or Arrows to move</p>
                </div>
                <button
                  onClick={resetGame}
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-slate-950 px-10 py-5 rounded-full font-black text-xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-green-500/20"
                >
                  <Play size={24} fill="currentColor" />
                  START GAME
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="mt-8 grid grid-cols-3 gap-2 md:hidden">
        <div />
        <button 
          className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center active:bg-green-500 active:text-slate-950 transition-colors"
          onPointerDown={() => direction.y === 0 && setDirection({ x: 0, y: -1 })}
        >
          <ArrowUp size={24} />
        </button>
        <div />
        <button 
          className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center active:bg-green-500 active:text-slate-950 transition-colors"
          onPointerDown={() => direction.x === 0 && setDirection({ x: -1, y: 0 })}
        >
          <ArrowLeft size={24} />
        </button>
        <button 
          className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center active:bg-green-500 active:text-slate-950 transition-colors"
          onPointerDown={() => direction.y === 0 && setDirection({ x: 0, y: 1 })}
        >
          <ArrowDown size={24} />
        </button>
        <button 
          className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center active:bg-green-500 active:text-slate-950 transition-colors"
          onPointerDown={() => direction.x === 0 && setDirection({ x: 1, y: 0 })}
        >
          <ArrowRight size={24} />
        </button>
      </div>

      {/* Instructions Footer */}
      <div className="mt-8 text-slate-600 text-[10px] uppercase tracking-[0.2em] font-bold hidden md:block">
        Space to Start/Pause • WASD or Arrows to Navigate
      </div>
    </div>
  );
}
