import * as Tone from "tone";
export default class Recording {
  player: Tone.Player;
  offset: number;
  end: number;
  hasRegion: boolean;
  ws: any;

  constructor() {
    this.player = new Tone.Player();
    this.offset = 0;
    this.end = 0;
    this.hasRegion = false;
    this.ws = null;
  }

  start() {
    if (this.hasRegion) {
      this.player.start(undefined, this.offset, this.end - this.offset);
    } else {
      this.player.start();
    }
  }

  stop() {
    this.player?.stop();
  }

  setRegion(start: number, end: number) {
    this.offset = start;
    this.end = end;
  }

  connect(node: any) {
    this.player.connect(node);
    return this.player;
  }

  clearRecording() {
    this.ws?.destroy();
    this.hasRegion = false;
  }

  cleanup() {
    this.ws?.destroy();
    this.player?.dispose();
  }
}