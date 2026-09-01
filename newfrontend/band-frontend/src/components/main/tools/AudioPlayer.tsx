import { useEffect, useRef, useState } from "react";

interface AudioPlayerProps {
  src: string;
}

function AudioPlayer({ src }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const loadMetadata = () => {
      setDuration(audio.duration);
    };

    const ended = () => {
      setPlaying(false);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", loadMetadata);
    audio.addEventListener("ended", ended);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", loadMetadata);
      audio.removeEventListener("ended", ended);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play();
      setPlaying(true);
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  const changeTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);

    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }

    setCurrentTime(time);
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);

    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }

    setVolume(newVolume);
  };

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return "0:00";

    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="audioplayer">
      <audio ref={audioRef} src={src} />

      <div className="desktopview">
        {
          src === ""
            ? (
              <button onClick={() => { }}>
                No Song
              </button>
            )
            : (
              <button onClick={togglePlay}>
                {playing ? "Pause" : "Play"}
              </button>
            )
        }
      </div>

      <div className="mobileview">
        {
          src === ""
            ? (
              <button onClick={() => { }}>
                O
              </button>
            )
            : (
              <button onClick={togglePlay}>
                {playing ? "||" : ">"}
              </button>
            )
        }
      </div>

      <span>{formatTime(currentTime)}</span>

      <input
        className="songtimeline"
        type="range"
        min="0"
        max={duration}
        value={currentTime}
        onChange={changeTime}
      />

      <span>{formatTime(duration)}</span>

      {/* don't show volume on mobile */}
      <input
        className="songvolume desktopview"
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={changeVolume}
      />

      <span className="desktopview">Volume</span>
    </div>
  );
}

export default AudioPlayer;