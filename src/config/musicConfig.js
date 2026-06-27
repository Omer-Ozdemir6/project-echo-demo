// musicConfig.js
// src/config/musicConfig.js
//
// Suno'dan indirdiğin .mp3 dosyalarını
// public/audio/music/ klasörüne koy.
// Örnek: public/audio/music/ep01_06_exploration.mp3

export const MUSIC_LAYERS = {

  // ─── EP01-06: Keşif — Drone + hafif piano, koro yok ─────────────────────
  exploration: {
    src:     '/audio/music/ep01_06_exploration.mp3',
    volume:  0.55,
    loop:    true,
    label:   'EP01-06 Keşif',
  },

  // ─── EP07-10: Gerilim — Nefes + palpitasyon eklendi ─────────────────────
  tension: {
    src:     '/audio/music/ep07_10_tension.mp3',
    volume:  0.65,
    loop:    true,
    label:   'EP07-10 Gerilim',
  },

  // ─── EP11-14: Tehlike — İlk glissando, ilk choir ────────────────────────
  danger: {
    src:     '/audio/music/ep11_14_danger.mp3',
    volume:  0.70,
    loop:    true,
    label:   'EP11-14 Tehlike',
  },

  // ─── EP15-17: Klimaks — Tüm layerlar aktif ──────────────────────────────
  climax: {
    src:     '/audio/music/ep15_17_climax.mp3',
    volume:  0.75,
    loop:    true,
    label:   'EP15-17 Klimaks',
  },

  // ─── ONLAR sahnesi — 432 Hz dominant, entity presence ───────────────────
  entity: {
    src:     '/audio/music/onlar_entity.mp3',
    volume:  0.80,
    loop:    true,
    label:   'ONLAR Varlığı',
  },

  // ─── Ölüm sting — kısa, loop yok ────────────────────────────────────────
  death: {
    src:     '/audio/music/death_sting.mp3',
    volume:  0.90,
    loop:    false,
    label:   'Ölüm',
  },

  // ─── Checkpoint — kısa relief ────────────────────────────────────────────
  checkpoint: {
    src:     '/audio/music/checkpoint_relief.mp3',
    volume:  0.50,
    loop:    false,
    label:   'Checkpoint',
  },

  // ─── Güneş sahnesi — EP13, melankoli ────────────────────────────────────
  gunes: {
    src:     '/audio/music/ep13_gunes.mp3',
    volume:  0.55,
    loop:    true,
    label:   'Güneş Yıldız',
  },

  // ─── Sonlar ──────────────────────────────────────────────────────────────
  ending_a: {
    src:     '/audio/music/ep18_son_a_kilit.mp3',
    volume:  0.65,
    loop:    false,
    label:   'Son A — Kilit',
  },
  ending_b: {
    src:     '/audio/music/ep19_son_b_birlikte.mp3',
    volume:  0.65,
    loop:    false,
    label:   'Son B — Birlikte',
  },
  ending_c: {
    src:     '/audio/music/ep20_son_c_anlat.mp3',
    volume:  0.65,
    loop:    false,
    label:   'Son C — Anlat',
  },

  // ─── Sessizlik — hiçbir müzik çalmasın ──────────────────────────────────
  silence: {
    src:     null,
    volume:  0,
    loop:    false,
    label:   'Sessizlik',
  },
};

// Episode ID → müzik katmanı eşleştirmesi
export const EPISODE_MUSIC_MAP = {
  // EP01-06 — Keşif
  episode_01: 'exploration',
  episode_02: 'exploration',
  episode_03: 'exploration',
  episode_04: 'exploration',
  episode_05: 'exploration',
  episode_06: 'exploration',

  // EP07-10 — Gerilim
  episode_07: 'tension',
  episode_08: 'tension',
  episode_09: 'tension',
  episode_10: 'tension',

  // EP11-14 — Tehlike (ilk choir)
  episode_11: 'danger',
  episode_12: 'danger',
  episode_13: 'gunes',    // Güneş sahnesi ayrı müzik
  episode_14: 'danger',

  // EP15-17 — Klimaks
  episode_15: 'climax',
  episode_16: 'climax',
  episode_17: 'climax',

  // EP18-20 — Sonlar
  episode_18: 'ending_a',
  episode_19: 'ending_b',
  episode_20: 'ending_c',
};

// Node ID bazında özel müzik geçişleri
// Belirli bir node'a gelindiğinde müzik değişir
export const NODE_MUSIC_OVERRIDES = {
  // ONLAR sahneleri
  'ep08_death_node':    'death',
  'ep08_n10_mekanizma': 'entity',
  'ep10_n08_gunes':     'entity',
  'ep14_death_node':    'death',
  'ep14_n07_onlar':     'entity',
  'ep17_son_gecis':     'entity',

  // Ölüm node'ları
  'ep01_hard_fail':     'death',
  'ep03_hard_fail':     'death',
  'ep04_death_node':    'death',
  'ep04_hard_fail':     'death',
  'ep06_hard_fail':     'death',
  'ep07_hard_fail':     'death',
  'ep12_hard_fail':     'death',
  'ep13_hard_fail':     'death',

  // Güneş sahnesi
  'ep13_n01':           'gunes',
  'ep13_n05_getirdi':   'gunes',
  'ep13_son':           'gunes',

  // Checkpoint anları (kısa relief sonrası episode müziğine dön)
  'ep02_n08_kirilgan':  'checkpoint',
  'ep04_cp01':          'checkpoint',
  'ep08_n09_selin':     'checkpoint',
  'ep12_n07_basari':    'checkpoint',
  'ep13_cp01':          'checkpoint',
  'ep15_cp01':          'checkpoint',
  'ep16_cp01':          'checkpoint',
};