import React, { useState, useRef, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Play, Pause, RotateCcw, Shuffle } from 'lucide-react';

const PATTERNS = {
  glider: {
    name: 'Glider',
    pattern: [
      [0, 1, 0],
      [0, 0, 1],
      [1, 1, 1]
    ]
  },
  block: {
    name: 'Block',
    pattern: [
      [1, 1],
      [1, 1]
    ]
  },
  blinker: {
    name: 'Blinker',
    pattern: [
      [1],
      [1],
      [1]
    ]
  },
  galaxy: {
    name: 'Galaxy',
    pattern: [
      [1, 1, 0, 1, 1, 1, 1, 1, 1],
      [1, 1, 0, 1, 1, 1, 1, 1, 1],
      [1, 1, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 0, 0, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 0, 0, 1, 1],
      [1, 1, 0, 0, 0, 0, 0, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 1, 1],
      [1, 1, 1, 1, 1, 1, 0, 1, 1],
      [1, 1, 1, 1, 1, 1, 0, 1, 1]
    ]
  },
  spaceship: {
    name: 'Spaceship',
    pattern: [
      [0, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [0, 0, 0, 0, 1],
      [1, 0, 0, 1, 0]
    ]
  }
};

const LifeGame = () => {
  const canvasRef = useRef(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [grid, setGrid] = useState([]);
  const [width] = useState(50);
  const [height] = useState(50);
  const [cellSize] = useState(12);
  const intervalRef = useRef(null);

  // 初期グリッドの作成
  useEffect(() => {
    const initialGrid = Array(height).fill().map(() => 
      Array(width).fill(0)
    );
    setGrid(initialGrid);
  }, []);

  // シミュレーション実行の監視
  useEffect(() => {
    if (isSimulating) {
      intervalRef.current = setInterval(() => {
        setGrid(prevGrid => nextStep(prevGrid));
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSimulating]);

  // グリッドの描画を監視
  useEffect(() => {
    drawGrid(grid);
  }, [grid]);

  // ランダムグリッドの生成
  const generateRandomGrid = () => {
    stopSimulation();
    const newGrid = Array(height).fill().map(() =>
      Array(width).fill(0).map(() => Math.random() > 0.85 ? 1 : 0)
    );
    setGrid(newGrid);
  };

  // パターンの配置
  const placePattern = (pattern) => {
    stopSimulation();
    const newGrid = Array(height).fill().map(() => Array(width).fill(0));
    const startY = Math.floor(height / 2 - pattern.length / 2);
    const startX = Math.floor(width / 2 - pattern[0].length / 2);

    pattern.forEach((row, y) => {
      row.forEach((cell, x) => {
        newGrid[startY + y][startX + x] = cell;
      });
    });
    setGrid(newGrid);
  };

  // キャンバスの描画
  const drawGrid = (currentGrid) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 背景を白に
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // グリッド線の描画
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, height * cellSize);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(width * cellSize, y * cellSize);
      ctx.stroke();
    }

    // セルの描画
    ctx.fillStyle = '#3b82f6';
    currentGrid.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          ctx.fillRect(
            x * cellSize + 1,
            y * cellSize + 1,
            cellSize - 2,
            cellSize - 2
          );
        }
      });
    });
  };

  // キャンバスのクリック処理
  const handleCanvasClick = (event) => {
    if (isSimulating) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor(((event.clientX - rect.left) * scaleX) / cellSize);
    const y = Math.floor(((event.clientY - rect.top) * scaleY) / cellSize);

    if (x >= 0 && x < width && y >= 0 && y < height) {
      setGrid(prevGrid => {
        const newGrid = prevGrid.map(row => [...row]);
        newGrid[y][x] = newGrid[y][x] ? 0 : 1;
        return newGrid;
      });
    }
  };

  // 周囲の生きたセルをカウント
  const countAliveNeighbors = (grid, x, y) => {
    let count = 0;
    for (let dx of [-1, 0, 1]) {
      for (let dy of [-1, 0, 1]) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          count += grid[ny][nx];
        }
      }
    }
    return count;
  };

  // 次の状態を計算
  const nextStep = (currentGrid) => {
    const newGrid = currentGrid.map(row => [...row]);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const aliveNeighbors = countAliveNeighbors(currentGrid, x, y);
        if (currentGrid[y][x]) {
          newGrid[y][x] = aliveNeighbors === 2 || aliveNeighbors === 3 ? 1 : 0;
        } else {
          newGrid[y][x] = aliveNeighbors === 3 ? 1 : 0;
        }
      }
    }
    
    return newGrid;
  };

  // シミュレーション開始
  const startSimulation = () => {
    setIsSimulating(true);
  };

  // シミュレーション停止
  const stopSimulation = () => {
    setIsSimulating(false);
  };

  // リセット
  const resetGrid = () => {
    stopSimulation();
    setGrid(Array(height).fill().map(() => Array(width).fill(0)));
  };

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle>Life Game Simulator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-4">
            <canvas
              ref={canvasRef}
              width={width * cellSize}
              height={height * cellSize}
              onClick={handleCanvasClick}
              className="border border-gray-300 cursor-pointer bg-white"
            />
            <div className="flex gap-4">
              {!isSimulating ? (
                <Button
                  onClick={startSimulation}
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Start
                </Button>
              ) : (
                <Button
                  onClick={stopSimulation}
                  className="flex items-center gap-2"
                  variant="secondary"
                >
                  <Pause className="w-4 h-4" />
                  Stop
                </Button>
              )}
              <Button
                onClick={resetGrid}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col gap-2 ml-4">
            <Button
              onClick={generateRandomGrid}
              className="w-full flex items-center gap-2"
              variant="outline"
            >
              <Shuffle className="w-4 h-4" />
              Random
            </Button>
            <div className="h-4" />
            <h3 className="text-sm font-semibold mb-2">Patterns</h3>
            {Object.entries(PATTERNS).map(([key, value]) => (
              <Button
                key={key}
                onClick={() => placePattern(value.pattern)}
                variant="outline"
                size="sm"
                className="w-full text-left justify-start"
              >
                {value.name}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LifeGame;
