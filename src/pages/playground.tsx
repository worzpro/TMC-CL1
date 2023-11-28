import * as Tone from "tone";
import { useRef, useEffect, useState } from "react";
import WaveSurferPlayer from "@/components/waveSurfer";

const Playground = ({ isToneStarted }: { isToneStarted: boolean }) => {
  const [isRecording, setIsRecording] = useState(false);
  const playerRef = useRef<any>(Array(4).fill(null));
  const micRef = useRef<any>(null);
  const recorderRef = useRef<any>(null);

  useEffect(() => {
    if (isToneStarted) {
      const mic = new Tone.UserMedia();
      const recorder = new Tone.Recorder();
      mic.connect(recorder);
      micRef.current = mic;
      recorderRef.current = recorder;
    }
  }, [isToneStarted]);

  const onRecordClick = () => {
    console.log("start recording...");
    recorderRef.current.start();
    setIsRecording(true);
  };

  const onRecordStop = async () => {
    console.log("stop recording...");

    const data = await recorderRef.current.stop();
    const blobUrl = URL.createObjectURL(data);
    playerRef.current = new Tone.Player(blobUrl).toDestination();
    setIsRecording(false);
  };

  const onPlay = () => {
    if (!playerRef.current) {
      return;
    }
    playerRef.current.start();
  };
  return <WaveSurferPlayer />;
};

export default Playground;
