import * as Tone from "tone";
export default class Recording {
  player: Tone.Player;
  offset: number;
  end: number;
  hasRegion: boolean;
  removed: boolean;
  ws: any;
  region: any;

  constructor() {
    this.player = new Tone.Player(undefined, () => {
      this.removed = false
    });
    this.offset = 0;
    this.end = 0;
    this.hasRegion = false;
    this.removed = false;
    this.ws = null;
    this.region = null;
  }

  start() {
    if (!this.player.loaded || this.removed) {
      return;
    }
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
    this.hasRegion = false;
    this.ws?.destroy();
    this.removed = true;
  }

  unsync() {
    this.player?.unsync();
  }

  dispose() {
    this.ws?.destroy();
    this.player?.dispose();
  }
}