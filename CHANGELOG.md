# Changelog

## [0.1.0] - 2026-01-20

### Added
- **User Persona Settings**: New tab in Settings Panel to manage user profiles (Name, Pronouns, Avatar, Description).
- **Settings Panel**: Refactored from Modal to collapsible Side Panel.
- **LLM Infrastructure**: Added `llm-service.ts` and `llm-config.ts` for multi-provider support (OpenAI, KoboldAI, Custom).
- **Cartridge Schema**: Defined core `Cartridge`, `PersonaDefinition`, and `GlassManifest` types.
- **Persistence**: Added `persona-service.ts` to persist user profiles to `localStorage`.

### Changed
- **Main**: Wired chat input to LLM service and active user persona.
- **Store**: Updated `AppState` to include `manifest`, `cartridge`, and `userPersona`.
- **UI**: Updated `styles.css` for side-panel animations and dark theme.
