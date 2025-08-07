export const FPS_DATA = {
  // Base FPS for a mid-range (rating 3) system at 1080p Medium
  BASE_FPS: 60,

  // Adjustments per rating point for 1080p
  RATING_ADJUST: 20,

  // Game-specific multipliers
  GAMES: {
    "Fortnite": { "1080p": { "Medium": 1.0, "High": 0.85, "Epic": 0.7 }, "1440p": { "Medium": 0.7, "High": 0.55, "Epic": 0.4 }, "4K": { "Medium": 0.4, "High": 0.3, "Epic": 0.2 } },
    "Cyberpunk 2077": { "1080p": { "Medium": 0.8, "High": 0.6, "Ultra": 0.4 }, "1440p": { "Medium": 0.5, "High": 0.4, "Ultra": 0.3 }, "4K": { "Medium": 0.2, "High": 0.15, "Ultra": 0.1 } },
    "CS2 (Counter-Strike 2)": { "1080p": { "Medium": 1.2, "High": 1.0, "Max": 0.9 }, "1440p": { "Medium": 0.9, "High": 0.75, "Max": 0.6 }, "4K": { "Medium": 0.5, "High": 0.4, "Max": 0.3 } },
    "Grand Theft Auto V": { "1080p": { "Medium": 1.1, "High": 0.9, "Very High": 0.7 }, "1440p": { "Medium": 0.8, "High": 0.65, "Very High": 0.5 }, "4K": { "Medium": 0.45, "High": 0.35, "Very High": 0.25 } },
    "Elden Ring": { "1080p": { "Medium": 0.9, "High": 0.7, "Max": 0.5 }, "1440p": { "Medium": 0.6, "High": 0.5, "Max": 0.35 }, "4K": { "Medium": 0.3, "High": 0.2, "Max": 0.15 } },
  },
};