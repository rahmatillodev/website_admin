import React, { useState, useRef, useEffect, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Music, Play, Pause, RotateCcw, RotateCw, Volume2, HelpCircle } from "lucide-react";

const RightContentSidebar = ({ formData, setFormData, parts = [] }) => {
  const [playingAudio, setPlayingAudio] = useState(null);
  const [audioStats, setAudioStats] = useState({});
  const audioRefs = useRef({});

  // Calculate total question count
  const totalQuestionCount = useMemo(() => {
    let count = 0;
    for (const part of parts) {
      for (const group of part.question_groups || []) {
        if (group.type === "fill_in_blanks") {
          count += (group.answers || []).length;
        } else if (group.type === "drag_drop") {
          // Only count questions with is_correct: true
          count += (group.questions || []).filter(q => q.is_correct === true).length;
        } else {
          count += (group.questions || []).length;
        }
      }
    }
    return count;
  }, [parts]);
  const formatTime = (seconds) => {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };
  const handleTimeUpdate = (partIdx) => {
    const audio = audioRefs.current[partIdx];
    if (audio) {
      setAudioStats((prev) => ({
        ...prev,
        [partIdx]: {
          currentTime: audio.currentTime,
          duration: audio.duration,
          progress: (audio.currentTime / audio.duration) * 100,
        },
      }));
    }
  };

  const skipTime = (partIdx, amount) => {
    const audio = audioRefs.current[partIdx];
    if (audio) {
      audio.currentTime += amount;
    }
  };

  const handlePlayPause = (partIdx) => {
    const audio = audioRefs.current[partIdx];

    if (!audio) return;

    // Stop any other playing audio
    if (
      playingAudio !== null &&
      playingAudio !== partIdx &&
      audioRefs.current[playingAudio]
    ) {
      audioRefs.current[playingAudio].pause();
      audioRefs.current[playingAudio].currentTime = 0;
    }

    if (playingAudio === partIdx) {
      // Currently playing, so pause it
      audio.pause();
      setPlayingAudio(null);
    } else {
      // Play this audio
      audio.play().catch((err) => {
        console.error("Error playing audio:", err);
      });
      setPlayingAudio(partIdx);
    }
  };

  // Setup event listeners for audio elements
  useEffect(() => {
    const cleanupFunctions = [];

    Object.keys(audioRefs.current).forEach((partIdx) => {
      const audio = audioRefs.current[partIdx];
      if (audio) {
        const handleEnded = () => {
          setPlayingAudio((prev) => (prev === parseInt(partIdx) ? null : prev));
        };
        const handlePause = () => {
          setPlayingAudio((prev) => (prev === parseInt(partIdx) ? null : prev));
        };

        audio.addEventListener("ended", handleEnded);
        audio.addEventListener("pause", handlePause);

        cleanupFunctions.push(() => {
          audio.removeEventListener("ended", handleEnded);
          audio.removeEventListener("pause", handlePause);
        });
      }
    });

    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [parts]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          audio.pause();
          audio.src = "";
        }
      });
    };
  }, []);

  const partsWithAudio = parts.filter((part) => part.listening_url);

  return (
    <aside className="w-80 bg-white border-l p-6 space-y-8 overflow-y-auto shadow-inner">
      <div className="space-y-6">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          Global Settings
        </h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Practice Type</Label>
            <select
              className="w-full border border-gray-200 rounded-lg h-10 px-3 text-sm focus:ring-2 focus:ring-blue-500"
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
            >
              <option value="reading">Reading Practice</option>
              <option value="listening">Listening Practice</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Duration (min)</Label>
            <Input
              type="number"
              className="border-gray-200"
              value={formData.duration}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  duration: parseInt(e.target.value) || null,
                })
              }
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Difficulty Level</Label>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {["EASY", "MEDIUM", "HARD"].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setFormData({ ...formData, difficulty: lvl })}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${
                    formData.difficulty === lvl
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-gray-500">Total Questions</Label>
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <HelpCircle className="h-4 w-4 text-blue-600" />
              <span className="text-lg font-bold text-blue-700">{totalQuestionCount}</span>
              <span className="text-xs text-blue-600 ml-auto">
                {totalQuestionCount === 1 ? "Question" : "Questions"}
              </span>
            </div>
          </div>
        </div>
      </div>


      <div className="space-y-4 pt-6 border-t border-gray-100">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div className="space-y-0.5">
            <Label className="text-sm">Premium</Label>
            <p className="text-[10px] text-gray-400">Paid content</p>
          </div>
          <Switch
            checked={formData.is_premium}
            onCheckedChange={(v) => setFormData({ ...formData, is_premium: v })}
            />
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
          <div className="space-y-0.5">
            <Label className="text-sm">Visible</Label>
            <p className="text-[10px] text-gray-400">Publicly active</p>
          </div>
          <Switch
            checked={formData.is_active}
            onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
            />
        </div>
      </div>
            {/* Audio Players Section - Only show for listening tests */}
            {formData.type === "listening" && (
              <div className="space-y-4 pt-6 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Audio Players
                </h3>
      
                {partsWithAudio.length > 0 ? (
                  <div className="space-y-4">
                    {partsWithAudio.map((part) => {
                      const partIdx = parts.findIndex((p) => p === part);
                      const isPlaying = playingAudio === partIdx;
                      const stats = audioStats[partIdx] || {
                        currentTime: 0,
                        duration: 0,
                        progress: 0,
                      };
      
                      return (
                        <div
                          key={partIdx}
                          className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4"
                        >
                          <div className="flex flex-col space-y-1">
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tight">
                              Preview Player
                            </span>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div
                                  className={`p-3 rounded-full ${
                                    isPlaying ? "bg-blue-600" : "bg-blue-500"
                                  } shadow-md cursor-pointer transition-all`}
                                  onClick={() => handlePlayPause(partIdx)}
                                >
                                  {isPlaying ? (
                                    <Pause className="h-5 w-5 text-white fill-current" />
                                  ) : (
                                    <Play className="h-5 w-5 text-white fill-current ml-0.5" />
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-gray-800 truncate leading-tight">
                                    {part.listening_url.split("/").pop().slice(-20)}
                                  </span>
                                  <span className="text-[11px] text-gray-500 font-medium">
                                    {formatTime(stats.currentTime)} /{" "}
                                    {formatTime(stats.duration)}
                                  </span>
                                </div>
                              </div>
                              
                            </div>
                          </div>
      
                          {/* Progress Bar */}
                          <div className="relative w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-150"
                              style={{ width: `${stats.progress}%` }}
                            />
                          </div>
      
                          {/* Controls */}
                          <div className="flex items-center justify-between px-1">
                            <button
                              onClick={() => skipTime(partIdx, -10)}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => skipTime(partIdx, 10)}
                              className="text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <RotateCw className="h-4 w-4" />
                            </button>
                            <button className="text-gray-400 hover:text-blue-600 transition-colors">
                              <Volume2 className="h-4 w-4" />
                            </button>
                          </div>
      
                          <audio
                            ref={(el) => (audioRefs.current[partIdx] = el)}
                            src={part.listening_url}
                            onTimeUpdate={() => handleTimeUpdate(partIdx)}
                            onLoadedMetadata={() => handleTimeUpdate(partIdx)}
                            onEnded={() => setPlayingAudio(null)}
                            className="hidden"
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  // Bo'sh holat...
                  <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center">
                    <Music className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-[11px] text-gray-400 uppercase font-bold">
                      No Audio Files
                    </p>
                  </div>
                )}
              </div>
            )}
    </aside>
  );
};

export default RightContentSidebar;
