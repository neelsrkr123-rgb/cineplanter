'use client'

import { useState } from 'react'
import ReactPlayer from 'react-player'
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react'

interface VideoPlayerProps {
  youtubeId: string;
  title: string;
}

export default function VideoPlayer({ youtubeId, title }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)

  return (
    <div className="bg-black rounded-lg overflow-hidden">
      <ReactPlayer
        url={`https://www.youtube.com/watch?v=${youtubeId}`}
        playing={playing}
        volume={volume}
        muted={muted}
        width="100%"
        height="400px"
        controls={false}
      />
      
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <button 
          onClick={() => setPlaying(!playing)}
          className="text-white p-2 rounded hover:bg-gray-700"
        >
          {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setMuted(!muted)}
            className="text-white p-2 rounded hover:bg-gray-700"
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20"
          />
          
          <button className="text-white p-2 rounded hover:bg-gray-700">
            <Maximize className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}