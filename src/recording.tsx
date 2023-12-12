import * as Tone from "tone";
export default class Recording {
  player: Tone.Player;
  offset: number;
  end: number;
  hasRegion: boolean;
  ws: any;
  region: any;

  constructor() {
    this.player = new Tone.Player();
    this.offset = 0;
    this.end = 0;
    this.hasRegion = false;
    this.ws = null;
    this.region = null;
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

  setRegionBoundary(start: number, end: number) {
    this.offset = start;
    this.end = end;
  }

  setRegion(region: any) {
    this.region = region;
    this.setRegionBoundary(region.start, region.end);
    this.hasRegion = true;
  }

  connect(node: any) {
    this.player.connect(node);
    return this.player;
  }

  clearRegion() {
    if (this.hasRegion) {
      this.region.remove();
      this.hasRegion = false;
    }
  }

  clearRecording() {
    this.ws?.destroy();
    this.hasRegion = false;
  }

  unsync() {
    this.player?.unsync();
  }

  dispose() {
    this.ws?.destroy();
    this.player?.dispose();
  }
}