import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup Pfade
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TARGET_DIR = path.join(__dirname, 'src/assets/scraped');

// URLs die wir abgrasen (Startseite + Unterseiten für Bilder)
const PAGES = [
    'https://www.turmdecker.com/',
    'https://www.turmdecker.com/eindeckungen/',
    'https://www.turmdecker.com/spezialarbeiten/',
    'https://www.turmdecker.com/restaurierung/'
];

// Sicherstellen, dass der Ordner existiert
if (!fs.existsSync(TARGET_DIR)){
    fs.mkdirSync(TARGET_DIR, { recursive: true });
}

async function downloadImage(url, filename) {
    const filePath = path.resolve(TARGET_DIR, filename);
    const writer = fs.createWriteStream(filePath);

    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (e) {
        console.error(`❌ Fehler beim Laden von ${url}:`, e.message);
    }
}

async function scrape() {
    console.log('🚀 Starte Image-Scraping von turmdecker.com...');
    
    let imageCounter = 0;
    const seenUrls = new Set();

    for (const pageUrl of PAGES) {
        try {
            console.log(`📡 Analysiere ${pageUrl}...`);
            const { data } = await axios.get(pageUrl);
            const $ = cheerio.load(data);
            
            // Suche alle Bilder im Content-Bereich
            $('img').each((i, el) => {
                let imgUrl = $(el).attr('src');
                
                if (!imgUrl) return;

                // Relative URLs fixen
                if (!imgUrl.startsWith('http')) {
                    if (imgUrl.startsWith('/')) {
                        imgUrl = `https://www.turmdecker.com${imgUrl}`;
                    } else {
                        // Ignorieren wenn unklar oder base64
                        return; 
                    }
                }

                // Filter: Keine kleinen Icons oder Tracking-Pixel
                if (imgUrl.includes('logo') || imgUrl.match(/\.(svg|gif)$/)) return;
                
                // Duplikate vermeiden
                if (seenUrls.has(imgUrl)) return;
                seenUrls.add(imgUrl);

                // Dateiname generieren
                const ext = path.extname(imgUrl) || '.jpg';
                // Sauberen Namen generieren
                const name = `turmdecker_img_${++imageCounter}${ext}`;
                
                console.log(`⬇️  Lade herunter: ${name}`);
                downloadImage(imgUrl, name);
            });

        } catch (error) {
            console.error(`Fehler auf ${pageUrl}:`, error.message);
        }
    }
    console.log(`✅ Fertig! Bilder liegen in src/assets/scraped/`);
}

scrape();