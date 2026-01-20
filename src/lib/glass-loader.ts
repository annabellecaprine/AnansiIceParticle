import JSZip from 'jszip';
import type { Cartridge, GlassManifest, CharacterCard, Lorebook } from './types';

/**
 * Load and parse a .glass cartridge file
 */
export async function loadGlassFile(file: File): Promise<Cartridge> {
    const zip = new JSZip();
    const loaded = await zip.loadAsync(file);

    // 1. Load Manifest (Optional for Gallery Mode)
    let manifest: GlassManifest;
    const manifestFile = loaded.file('manifest.json');

    if (manifestFile) {
        const manifestText = await manifestFile.async('text');
        manifest = JSON.parse(manifestText);
    } else {
        // Fallback: Create implied manifest
        console.warn('[IceParticle] No manifest.json found, checking for loose images...');
        manifest = {
            version: "1.0",
            title: "Gallery Archive",
            author: "Unknown",
            exportedFrom: "Ice Particle Loader",
            createdAt: new Date().toISOString(),
            features: {
                hasCustomSprites: false,
                hasBackgrounds: false,
                emotionDetection: false
            }
        };
    }

    // 2. Load Character Card (Optional)
    let character: CharacterCard | undefined;
    const charFile = loaded.file('character.json');
    if (charFile) {
        const text = await charFile.async('text');
        character = JSON.parse(text);
    }

    // 3. Load Lorebook (Optional)
    let lorebook: Lorebook | undefined;
    const loreFile = loaded.file('lorebook.json');
    if (loreFile) {
        const text = await loreFile.async('text');
        lorebook = JSON.parse(text);
    }

    // 4. Asset Discovery
    const assets: Cartridge['assets'] = {
        backgrounds: {},
        midgrounds: {},
        foregrounds: {},
        sprites: {},
        gallery: []
    };

    // Iterate over all files to find images
    const imageFiles: { path: string; file: JSZip.JSZipObject }[] = [];
    loaded.forEach((path, entry) => {
        if (!entry.dir && /\.(png|jpg|jpeg|gif|webp)$/i.test(path)) {
            imageFiles.push({ path, file: entry });
        }
    });

    for (const { path, file } of imageFiles) {
        const blob = await file.async('blob');
        const url = URL.createObjectURL(blob);
        const filename = path.split('/').pop() || path;
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");

        // Categorize based on convention
        if (filename.endsWith('_bg.png') || filename.endsWith('_bg.jpg')) {
            assets.backgrounds[nameWithoutExt] = url;
            continue;
        }

        if (filename.endsWith('_mg.png')) {
            assets.midgrounds[nameWithoutExt] = url;
            continue;
        }

        if (filename.endsWith('_fg.png') || filename.endsWith('_fg.gif')) {
            assets.foregrounds[nameWithoutExt] = url;
            continue;
        }

        // Sprites: [actor]_sprite_[emotion].png
        // Regex: (.+)_sprite_(.+)\.png
        const spriteMatch = filename.match(/^(.+)_sprite_(.+)\.(png|webp|gif)$/i);
        if (spriteMatch) {
            const [_, actor, emotion] = spriteMatch;
            if (!assets.sprites[actor]) assets.sprites[actor] = {};
            assets.sprites[actor][emotion.toLowerCase()] = url;
            continue;
        }

        // Fallback: Gallery
        assets.gallery.push(url);
    }

    return {
        manifest,
        character,
        lorebook,
        assets
    };
}
