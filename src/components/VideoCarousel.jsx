import { useRef, useState, useEffect, useCallback } from 'react'

export function VideoCarousel({
                                  videos = [],
                                  sticky = false,
                                  autoAdvance = true,
                                  showControls = true,
                              }) {
    const trackRef  = useRef(null)
    const videoRefs = useRef([])
    const [idx,   setIdx]   = useState(0)
    const [muted, setMuted] = useState(true)

    // O prop `muted` em <video> do React não vira atributo HTML — sem isso
    // o autoplay é bloqueado. Garantimos o flag via ref antes de qualquer play().
    const assignRef = useCallback((el, i) => {
        videoRefs.current[i] = el
        if (el) el.muted = true
    }, [])

    const total = Math.max(videos.length, 1)
    const step  = 100 / total              // passo do translateX em % do track
    const prev = () => setIdx(i => (i - 1 + total) % total)
    const next = () => setIdx(i => (i + 1) % total)

    // Move o track na unidade certa e controla play/pause.
    // Como o track tem largura = total * 100% do container, cada "tela"
    // corresponde a step% (= 100/total %) do track.
    useEffect(() => {
        const track = trackRef.current
        if (track) {
            track.style.transform = `translateX(-${idx * step}%)`
        }

        videoRefs.current.forEach((v, i) => {
            if (!v) return
            if (i === idx) {
                v.currentTime = 0
                const p = v.play()
                if (p && typeof p.catch === 'function') p.catch(() => {})
            } else {
                v.pause()
            }
        })
    }, [idx, step])

    // Sincroniza mute em todos os vídeos.
    useEffect(() => {
        videoRefs.current.forEach(v => { if (v) v.muted = muted })
    }, [muted])

    // Container: flex-column + overflow:hidden (a viewport visual).
    const containerStyle = sticky
        ? {
            position:       'sticky',
            top:            'calc(var(--header-h) + 28px)',
            height:         'calc(100vh - var(--header-h) - 80px)',
            display:        'flex',
            flexDirection:  'column',
            borderRadius:   'var(--r-md)',
            border:         '1px solid var(--glass-border)',
            boxShadow:      'var(--glass-shadow)',
            overflow:       'hidden',
            background:     'var(--glass-bg)',
            backdropFilter: 'var(--blur)',
        }
        : {
            display:       'flex',
            flexDirection: 'column',
            width:         '100%',
            height:        '100%',
            overflow:      'hidden',
        }

    // Track tem largura fixa = total * 100% do container. Assim cada item, com
    // width = (100/total)%, vira exatamente uma container_width — independente
    // do conteúdo intrínseco do <video> e de qualquer min-width herdada da CSS.
    const trackStyle = {
        flex:       '0 0 auto',
        minHeight:  0,
        display:    'flex',
        width:      `${total * 100}%`,
        height:     '100%',
        transition: 'transform 0.5s cubic-bezier(.4,0,.2,1)',
        willChange: 'transform',
    }

    const itemStyle = {
        flex:       `0 0 ${step}%`,
        width:      `${step}%`,
        minWidth:   0,                     // anula `.video-item { min-width: 100% }`
        maxWidth:   `${step}%`,
        height:     '100%',
        background: '#000',
        overflow:   'hidden',
    }

    const videoStyle = {
        width:     '100%',
        height:    '100%',
        objectFit: 'contain',
        display:   'block',
    }

    if (videos.length === 0) return null

    return (
        <div className="video-box-container" style={containerStyle}>
            <div className="video-track" ref={trackRef} style={trackStyle}>
                {videos.map((src, i) => (
                    <div key={src + i} className="video-item" style={itemStyle}>
                        <video
                            ref={el => assignRef(el, i)}
                            src={src}
                            playsInline
                            autoPlay
                            preload="auto"
                            loop={!autoAdvance}
                            onEnded={autoAdvance ? next : undefined}
                            style={videoStyle}
                        />
                    </div>
                ))}
            </div>

            {showControls && (
                <div className="video-controls">
                    <button className="btn-carousel btn-prev" onClick={prev} aria-label="Anterior">❮</button>
                    <button
                        className="btn-floating-sound"
                        onClick={() => setMuted(m => !m)}
                        title="Som"
                        style={{ position: 'static' }}
                        aria-label={muted ? 'Ativar som' : 'Desativar som'}
                    >
                        {muted ? '🔇' : '🔊'}
                    </button>
                    <button className="btn-carousel btn-next" onClick={next} aria-label="Próximo">❯</button>
                </div>
            )}
        </div>
    )
}