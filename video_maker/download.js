const ytDlp = require('yt-dlp-exec');
const fs = require('fs');

const videos = [
    { id: '1_surfista', url: 'https://www.youtube.com/watch?v=uroABgZJOUA' },
    { id: '2_alberto', url: 'https://www.perfil.com/noticias/politica/video-asi-cruzo-alberto-fernandez-a-periodista-que-pregunto-por-cristina-kirchner-pero-anda-a-trabajar-de-periodista.phtml' },
    { id: '3_nestor', url: 'https://www.youtube.com/watch?v=JfFg7eglQ9s' },
    { id: '4_cristina', url: 'https://www.youtube.com/shorts/3sCWeRomuCw' },
    { id: '5_milei_ensobrados', url: 'https://www.instagram.com/reel/DLlOuRkOOBB/' },
    { id: '6_milei_odiamos', url: 'https://www.youtube.com/watch?v=uIJ07tysLdM' },
    { id: '7_seleccion', url: 'https://www.youtube.com/watch?v=-7HCD9W9TmY' },
    { id: '8_messi', url: 'https://www.youtube.com/watch?v=6JYvS4EaVVo' }
];

async function run() {
    console.log('🤖 Fuerte al Medio - Video Rendering Engine Activado');
    console.log('Iniciando extracción automática de recortes crudos...');
    
    for (let v of videos) {
        if (fs.existsSync(`${v.id}.mp4`)) {
            console.log(`✅ [${v.id}] Ya descargado. Omitiendo.`);
            continue;
        }
        
        console.log(`⏳ Descargando [${v.id}] desde ${v.url}...`);
        try {
            await ytDlp(v.url, {
                output: `${v.id}.mp4`,
                format: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
                noCheckCertificates: true,
                noWarnings: true
            });
            console.log(`✅ [${v.id}] Descargado con éxito.`);
        } catch (err) {
            console.error(`❌ Falló la descarga de [${v.id}]. Protecciones detectadas o URL ilegible.`);
        }
    }
    
    // Música de las Valquirias (Apocalypse Now versión o Standard)
    if (!fs.existsSync('RideOfTheValkyries.mp3')) {
        console.log(`⏳ Descargando Banda Sonora Épica (Ride of the Valkyries)...`);
        try {
            await ytDlp('https://www.youtube.com/watch?v=GGU1P6lBaPE', {
                output: 'RideOfTheValkyries.mp3',
                extractAudio: true,
                audioFormat: 'mp3',
                audioQuality: 0
            });
            console.log('✅ Banda sonora asegurada.');
        } catch (e) {
            console.log('❌ Error al bajar la banda sonora.');
        }
    }
    
    console.log('--------------------------------------------------');
    console.log('🏁 Proceso de Descarga Completado. Archivos listos para FFmpeg.');
}

run();
