/*
 * Maintains state of playhead over timeline
 */
class TimelineController {
  constructor(args) {
    this.timeline = args.timeline || new Timeline({
      frames: args.frames
    });
    //
    // `rate` is ratio of playtime to real time (0 = stopped)
    //
    this.rate = 0.0;
    //
    // `p` is playhead position over interval [0.0, 1.0]
    //
    this.p = 0;
    //
    // `t` and `last_t` define a window since last update in
    //    context of global time (does not describe playhead
    //    position)
    //
    this.t = 0;
    this.last_t = 0;
    //
    // stores data frame corresponding playhead position.
    //
    this.currentFrame = null;
    //
    // callback when data under playhead changes
    //
    this.onDataUpdate = args.onDataUpdate || ((args) => {
      console.log("Timeline not data bound", args);
    });
  }

  /*
   * Hook into global timer
   */
  update(t) {
    this.last_t = this.t;
    this.t = t;
    this.advance(this.t - this.last_t);
  }

  /*
   * Apply delta time to playhead position, translated via timeline.
   * Filter value to range of p.
   */
  advance(dt) {
    this.p += this.timeline.dpForDt(dt * this.rate);
    //
    // limit p on interval [0.0,1.0]
    //
    if (this.p > 1.0)
      this.p = 1.0;
    else if (this.p < 0.0)
      this.p = 0.0;

    if (this.currentFrame != this.timeline.frameForP(this.p)) {
      this.currentFrame = this.timeline.frameForP(this.p);

      let data = this.currentFrame.data;
      let lastData = (this.currentFrame.previous) ?
        this.currentFrame.previous.data : data;

      this.onDataUpdate({ data: data, lastData: lastData });
    }
  }
}

class Timeline {
  constructor(args) {
    if(args.frames) {
      //
      // sort frame list on time index and link items
      //
      this.frames = args.frames.slice().sort((a,b) => {
        return a.t - b.t;
      });
      this.frames.forEach((f, i) => {
        f.next = null;
        if (i == 0) {
          f.previous = null;
        } else {
          let previous = this.frames[i-1];
          f.previous = previous;
          previous.next = f;
        }
      });
    }
    else console.error("Timeline requires frames");
    //
    // `start_t` and `span_t` describe the extents of the timeline
    //
    this.start_t = this.frames[0].t;
    this.span_t = this.frames[this.frames.length - 1].t - this.start_t;
    //
    // `lrf` = last requested frame
    //
    this.lrf = this.frames[0];
  }

  dtForDp(dp) {
    return dp * this.span_t;
  }

  dpForDt(dt) {
    return dt / this.span_t;
  }

  pForT(t) {
    return (t - this.start_t) / this.span_t;
  }

  tForP(p) {
    return this.start_t + (p * this.span_t);
  }

  frameForP(p) {
    let t = this.tForP(p);
    while (true) {
      let f = this.lrf;
      if (f.t == t) {
        break;
      }
      else if (f.t < t) {
        if (f.next == null || f.next.t > t)
          break;
        this.lrf = f.next;
      }
      else if (f.t > t) {
        if (f.previous == null)
          break;
        this.lrf = f.previous;
      }
    }
    return this.lrf;
  }
}

class DataFrame {
  constructor(args) {
    this.t = args.t || 0;
    this.data = args.data || console.error("DataFrame requires data");
    this.previous = null;
    this.next = null;
  }
}
