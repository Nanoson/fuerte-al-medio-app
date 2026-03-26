import React from 'react';

// Grilla SVG 24x24 - Diseños Vectoriales Únicos de "Sombras" (Shadow Identities)
const avatarVectors = {
    // POLÍTICA
    valmont_pol: '<circle cx="12" cy="7" r="4.5" /><path d="M4 22 C4 15, 20 15, 20 22 Z" /><path d="M12 15 L15 22 L9 22 Z" fill="var(--bg-color)" /><path d="M11 15 L13 15 L12 22 Z" fill="currentColor"/><path d="M7 6 A2 2 0 1 0 11 6 A2 2 0 1 0 7 6 M13 6 A2 2 0 1 0 17 6 A2 2 0 1 0 13 6 M11 6 L13 6" stroke="var(--bg-color)" fill="none" strokeWidth="1.5"/>',
    montes_pol: '<circle cx="12" cy="8" r="4" /><path d="M12 2 A5.5 5.5 0 0 0 6.5 7.5 L6.5 13 C8 13.5, 9 12, 9 12 L9 9 L15 9 L15 12 C15 12, 16 13.5, 17.5 13 L17.5 7.5 A5.5 5.5 0 0 0 12 2 Z" fill="currentColor"/><path d="M5 22 C5 14, 19 14, 19 22 Z" />',
    rossi_pol: '<circle cx="12" cy="7" r="4" /><path d="M4 22 C4 14, 20 14, 20 22 Z" /><path d="M12 2 A5 5 0 0 0 7 7 L6 18 C8 18, 9 12, 12 12 C15 12, 16 18, 18 18 L17 7 A5 5 0 0 0 12 2 Z" fill="currentColor"/><path d="M8 14 C8 12, 16 12, 16 14 C16 16, 8 16, 8 14 Z M10 14 L10 21 L14 21 L14 14 Z" fill="currentColor" stroke="var(--bg-color)" strokeWidth="1"/>',
    cuesta_pol: '<circle cx="12" cy="7" r="4.5" /><path d="M4 22 C4 15, 20 15, 20 22 Z" /><path d="M8 15 L4 10 L10 12 Z M16 15 L20 10 L14 12 Z" fill="currentColor" stroke="var(--bg-color)" strokeWidth="0.5"/><path d="M12 13 L14.5 19 L9.5 19 Z" fill="var(--bg-color)" /><path d="M11.5 14 L12.5 14 L12 20 Z" fill="currentColor"/>',
    
    // ESPECTÁCULOS Y FARÁNDULA
    santillan_esp: '<circle cx="12" cy="8.5" r="4.5" /><path d="M3 22 C3 14, 21 14, 21 22 Z" /><path d="M7 6 L7 3 C7 2 17 2 17 3 L17 6 Z M3 7 C3 5 21 5 21 7 C21 8 3 8 3 7 Z" fill="currentColor"/><path d="M9 15 L4 10 L11 12 Z M15 15 L20 10 L13 12 Z" fill="currentColor" stroke="var(--bg-color)" strokeWidth="0.5"/><path d="M12 14 L15 19 L9 19 Z" fill="var(--bg-color)" />',
    dubois_esp: '<circle cx="12" cy="8" r="4.5" /><path d="M12 2 A6 6 0 0 0 6 8 L6 16 C7 16, 8 14, 8 14 L8 9 L16 9 L16 14 C16 14, 17 16, 18 16 L18 8 A6 6 0 0 0 12 2 Z" fill="currentColor"/><path d="M5 22 C5 14, 19 14, 19 22 Z" /><path d="M4 8 A8 8 0 0 1 20 8" fill="none" stroke="currentColor" strokeWidth="1.5"/><rect x="3" y="6" width="2" height="6" rx="1" fill="currentColor"/><rect x="19" y="6" width="2" height="6" rx="1" fill="currentColor"/>',
    ferrero_esp: '<circle cx="12" cy="7" r="4.5" /><path d="M4 22 C4 14, 20 14, 20 22 Z" /><path d="M7 6 A2 2 0 1 0 11 6 A2 2 0 1 0 7 6 M13 6 A2 2 0 1 0 17 6 A2 2 0 1 0 13 6 M11 6 L13 6" stroke="var(--bg-color)" fill="none" strokeWidth="1.5"/><path d="M6 13 C6 10, 18 10, 18 13 C18 16, 6 16, 6 13 Z" fill="currentColor" stroke="var(--bg-color)" strokeWidth="1"/>',
    lemoine_esp: '<circle cx="12" cy="8" r="4.5" /><circle cx="18" cy="6" r="2.5" /><path d="M5 22 C5 15, 19 15, 19 22 Z" /><path d="M9 15 C12 18, 15 15, 15 15" stroke="var(--bg-color)" fill="none" strokeWidth="1.5" strokeDasharray="1 2"/>',
    
    // DEPORTES
    vieri_dep: '<circle cx="12" cy="8" r="4.5" /><path d="M4 22 C3 15, 21 15, 20 22 Z" /><path d="M7 6 A5 5 0 0 1 17 6 Z" fill="currentColor"/><path d="M15 6 L21 6 L21 7.5 L7 7.5 Z" fill="currentColor" stroke="var(--bg-color)" strokeWidth="0.5"/>',
    bernal_dep: '<circle cx="12" cy="7" r="4.5" /><path d="M4 22 C4 15, 20 15, 20 22 Z" /><rect x="17" y="14" width="2.5" height="8" rx="1" fill="currentColor" stroke="var(--bg-color)" strokeWidth="0.5"/><circle cx="18.25" cy="13" r="2.5" fill="currentColor"/>',
    fassi_dep: '<circle cx="12" cy="7" r="4" /><path d="M5 22 C5 15, 19 15, 19 22 Z" /><path d="M7 6 A1.5 1.5 0 1 0 10 6 A1.5 1.5 0 1 0 7 6 M14 6 A1.5 1.5 0 1 0 17 6 A1.5 1.5 0 1 0 14 6 M10 6 L14 6" stroke="var(--bg-color)" fill="none" strokeWidth="1.5"/><rect x="15" y="14" width="6" height="8" rx="0.5" fill="currentColor" stroke="var(--bg-color)" strokeWidth="1"/>',
    conti_dep: '<circle cx="12" cy="8" r="4.5" /><path d="M12 2 A6 6 0 0 0 7 7 C7 10, 10 12, 12 12 C14 12, 17 10, 17 7 A6 6 0 0 0 12 2 Z" fill="currentColor"/><path d="M5 6 C3 8, 3 12, 5 14" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M14 10 C16 10, 17 9, 17 7" fill="none" stroke="currentColor" strokeWidth="2"/><path d="M5 22 C5 15, 19 15, 19 22 Z" />',
    
    // MERCADOS
    pendelton_mer: '<circle cx="12" cy="8" r="4.2" /><path d="M8 4 C10 2, 15 2, 16 5 C16 6, 17 7, 16 9 C15 7, 13 6, 8 7 Z" fill="currentColor"/><path d="M5 22 C5 16, 19 16, 19 22 Z" /><path d="M12 16 L15 22 L9 22 Z" fill="var(--bg-color)" /><path d="M11.5 17 L12.5 17 L12 21 Z" fill="currentColor"/>',
    damico_mer: '<circle cx="12" cy="7" r="4" /><path d="M7 5 C8 2, 13 1, 16 4 C18 6, 16 9, 14 9 C15 7, 13 6, 9 7 C7 9, 5 7, 7 5 Z" fill="currentColor"/><path d="M4 22 C4 15, 20 15, 20 22 Z" /><path d="M10 15 L14 15 L12 20 Z" fill="var(--bg-color)" /><path d="M11 15 L13 15 L12 19 Z" fill="currentColor"/>',
    blanc_mer: '<circle cx="12" cy="8" r="4.5" /><path d="M12 2 C7 2, 6 6, 6 10 L8 14 L10 9 L14 9 L16 14 L18 10 C18 6, 17 2, 12 2 Z" fill="currentColor"/><path d="M7 6.5 L11 6.5 M13 6.5 L17 6.5 M11 6.5 L13 6.5" stroke="var(--bg-color)" strokeWidth="1"/><path d="M6 22 C6 15, 18 15, 18 22 Z" />',
    herrera_mer: '<circle cx="12" cy="7" r="4.5" /><path d="M6 7 A 6 6 0 0 1 18 7" fill="none" stroke="var(--bg-color)" strokeWidth="2" /><rect x="4" y="5" width="3" height="5" rx="1.5" fill="currentColor"/><rect x="17" y="5" width="3" height="5" rx="1.5" fill="currentColor"/><path d="M5 22 C5 14, 19 14, 19 22 Z" />'
};

const AuthorAvatar = ({ authorId, size = 60 }) => {
    // Fallback genérico "Default Neutral Shadow" si el ID no existe
    const defaultAvatar = '<circle cx="12" cy="8" r="5" /><path d="M4 22 C4 15, 20 15, 20 22 Z" />';
    const rawSvg = avatarVectors[authorId] || defaultAvatar;

    return (
        <svg 
            width={size} 
            height={size + 10} 
            viewBox="0 0 24 24" 
            fill="var(--text-main)" 
            style={{ 
                marginBottom: '-2px', // Anclaje al borde inferior del contenedor
                opacity: 0.85, 
                transition: 'all 0.3s' 
            }}
            dangerouslySetInnerHTML={{ __html: rawSvg }}
        />
    );
};

export default AuthorAvatar;
