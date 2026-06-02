// Per-project 3D model + resting framing — the single source of truth shared by
// the /work/ gallery (WorkGallery) and the individual project pages (the model
// that now opens every project page). Tuning a model's pose happens here, once.
//
// `fill`   = how much of the frame the bounding sphere fills (≤1 → never clips).
// `viewRY` / `viewRX` = the resting yaw / pitch the stage opens on.
// Keyed by project slug. Projects absent here have no model (e.g. The Nuclear
// Question — web/data work) and fall back to a text-forward header.

export interface ModelFraming {
  model: string;
  fill: number;
  viewRY: number;
  viewRX: number;
}

export const MODELS: Record<string, ModelFraming> = {
  // The Nuclear Question has no GLB here — it is shown as the live nucleus atom
  // (NuclearAtom) on its project page and in the /work/ gallery, and as a
  // particle beat in the homepage ScrollHero. So it is intentionally absent.
  'mantis':               { model: '/models/mantis.glb',     fill: 0.9,  viewRY: 0.0,  viewRX: 0.28 },
  'wave':                 { model: '/models/speaker.glb',    fill: 0.94, viewRY: 0.0,  viewRX: 0.0  },
  'backgammon':           { model: '/models/backgammon.glb', fill: 0.96, viewRY: -0.7, viewRX: 0.62 },
  'lumi':                 { model: '/models/lumi.glb',       fill: 0.88, viewRY: 0.2,  viewRX: 0.12 },
  'yourpal':              { model: '/models/yourpal.glb',    fill: 0.86, viewRY: 0.25, viewRX: 0.1  },
  'spider-209':           { model: '/models/spider.glb',     fill: 0.88, viewRY: 0.3,  viewRX: 0.15 },
  'universal-phone-case': { model: '/models/wabiSabi.glb',   fill: 0.86, viewRY: 0.3,  viewRX: 0.1  },
};
