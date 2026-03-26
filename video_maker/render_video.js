const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

const cuts = [
    { file: 'Surfista (Parte 1) Violó la cuarentena y deambuló por la ciudad _ CUARENTENTA OBLIGATORIA.mp4', start: '00:00:50', end: '00:01:02' },
    { file: 'Alberto Fernández a periodista que le preguntó por Cristina_ _Andá a trabajar_.mp4', start: '00:00:05', end: '00:00:09' },
    { file: 'Nestor Kirchner trasladandose del Congreso a la Casa Rosada 2003.mp4', start: '00:01:48', end: '00:01:58' },
    { file: '_Ensobrados de derecha__ Cristina Kirchner criticó a los periodistas que toman postura de partidos.mp4', start: '00:00:23', end: '00:00:30' },
    { file: '_Ensobrados de derecha__ Cristina Kirchner criticó a los periodistas que toman postura de partidos.mp4', start: '00:00:41', end: '00:00:46' },
    { file: '🔥 MILEI ESTALLÓ CONTRA PERIODISTAS ENSOBRADOS.mp4', start: '00:00:00', end: '00:00:18' },
    { file: 'Los ataques de Javier Milei al periodismo.mp4', start: '00:01:30', end: '00:01:36' },
    { file: 'Leo Messi en Llave a la Eternidad.mp4', start: '00:32:39', end: '00:33:04' },
    { file: '\'\'Y no me importan lo que digan esos putos periodistas...\'\' el canto de Argentina a la prensa.mp4', start: '00:00:11', end: '00:00:22' },
    { file: 'MARADONA (Passman, la tenés adentro).mp4', start: '00:00:05', end: '00:00:08' } // Coda sin musica
];

const musicFile = 'Richard Wagner - The Ride of the Valkyries (From Apocalypse Now).mp3';

const normalizeClip = (clip, index) => {
    return new Promise((resolve, reject) => {
        const out = `norm_${index}.mp4`;
        console.log(`[1/4] Normalizando clip ${index} / ${cuts.length}...`);
        
        ffmpeg(clip.file)
            .setStartTime(clip.start)
            .setDuration(clip.end ? getSeconds(clip.end) - getSeconds(clip.start) : '')
            .videoCodec('libx264')
            .audioCodec('aac')
            .audioFrequency(48000)
            .audioChannels(2)
            .outputOptions([
                '-vf scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30',
                '-pix_fmt yuv420p',
                '-preset ultrafast'
            ])
            .on('end', resolve)
            .on('error', reject)
            .save(out);
    });
};

const getSeconds = (hms) => {
    const [h, m, s] = hms.split(':').map(Number);
    return h * 3600 + m * 60 + s;
};

const createPlaca = () => {
    return new Promise((resolve, reject) => {
        console.log('[1.5/4] Generando Placa Final Fuerte al Medio...');
        if (fs.existsSync('norm_11.mp4')) {
            console.log('✅ Placa ya generada. Omitiendo.');
            return resolve();
        }
        
        ffmpeg()
            .input('color=c=black:s=1920x1080:d=3')
            .inputFormat('lavfi')
            .videoFilters([
                "drawtext=text='FUERTE AL MEDIO':fontcolor=white:fontsize=120:x=(w-text_w)/2:y=(h-text_h)/2-60",
                "drawtext=text='NO HACEMOS PERIODISMO':fontcolor=gray:fontsize=60:x=(w-text_w)/2:y=(h-text_h)/2+60"
            ])
            .outputOptions([
                '-c:v libx264',
                '-preset ultrafast'
            ])
            .on('end', () => {
                // Agregar stream de audio silencioso a la placa para poder concatenar sin error
                ffmpeg('placa.mp4')
                    .input('anullsrc=r=48000:cl=stereo')
                    .inputFormat('lavfi')
                    .outputOptions(['-c:v copy', '-c:a aac', '-shortest'])
                    .on('end', resolve).on('error', reject).save('norm_11.mp4');
            })
            .on('error', reject)
            .save('placa.mp4');
    });
};

const run = async () => {
    try {
        console.log('🤖 Fuerte Al Medio Cinematic Engine Iniciado...');
        let totalTimePart1 = 0;
        
        for (let i = 0; i < cuts.length; i++) {
            if (!fs.existsSync(`norm_${i + 1}.mp4`)) {
                await normalizeClip(cuts[i], i + 1);
            } else {
                console.log(`[1/4] Clip ${i+1} ya normalizado en 1080p, omitiendo compresión.`);
            }
            if (i < 9) {
                totalTimePart1 += getSeconds(cuts[i].end) - getSeconds(cuts[i].start);
            }
        }
        await createPlaca();

        // CONCATENAR PARTE 1 (Clips 1 al 9)
        console.log(`[2/4] Concatenando secuencia épica (duración aprox: ${totalTimePart1}s)...`);
        let concatListPart1 = '';
        for (let i = 1; i <= 9; i++) concatListPart1 += `file 'norm_${i}.mp4'\n`;
        fs.writeFileSync('concat_1.txt', concatListPart1);

        await new Promise((resolve, reject) => {
            ffmpeg()
                .input('concat_1.txt')
                .inputOptions(['-f concat', '-safe 0'])
                .outputOptions(['-c copy'])
                .on('end', resolve).on('error', reject).save('part1.mp4');
        });

        // MEZCLAR MÚSICA CON PARTE 1 (Crescendo y Fadeout brutal)
        console.log('[3/4] Mezclando Ride of the Valkyries sobre diálogos...');
        await new Promise((resolve, reject) => {
            ffmpeg()
                .input('part1.mp4')
                .input(musicFile)
                .complexFilter([
                    `[1:a]volume=0.35,afade=t=in:ss=0:d=4,afade=t=out:st=${totalTimePart1 - 3}:d=3[bgmusic]`,
                    `[0:a]volume=1.5[voices]`,
                    `[voices][bgmusic]amix=inputs=2:duration=first:dropout_transition=2[aout]`
                ])
                .outputOptions([
                    '-map 0:v', '-map [aout]',
                    '-c:v copy', '-c:a aac',
                    '-preset ultrafast'
                ])
                .on('end', resolve).on('error', reject).save('part1_mixed.mp4');
        });

        // CONCATENAR PARTE 1 MIXED + MARADONA (10) + PLACA (11)
        console.log('[4/4] Añadiendo Coda Final de Maradona y Placa de Marketing...');
        const concatListFinal = `file 'part1_mixed.mp4'\nfile 'norm_10.mp4'\nfile 'norm_11.mp4'\n`;
        fs.writeFileSync('concat_final.txt', concatListFinal);

        await new Promise((resolve, reject) => {
            ffmpeg()
                .input('concat_final.txt')
                .inputOptions(['-f concat', '-safe 0'])
                .outputOptions(['-c copy'])
                .on('end', resolve).on('error', reject).save('Video_Promocional_FuerteAlMedio.mp4');
        });

        console.log('🎬 ¡Renderizado Completado! Video Promocional Listo.');
    } catch (e) {
        console.error('❌ Error en el renderizado:', e);
    }
};

run();
