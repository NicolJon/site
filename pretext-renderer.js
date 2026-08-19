const text1 = "Nosso trabalho é entender a empresa por completo, identificar o que limita seu crescimento e transformar isso em estrutura, processos e decisões mais inteligentes.";
const text2 = "Na prática, ajudamos empresas a se profissionalizarem, com mais clareza, direção e consistência para crescer no próximo nível.";

// Font configs matching CSS (.about-desc)
const fontSize = 13.6; 
const fontString = `400 ${fontSize}px Montserrat, sans-serif`;
const lineHeight = fontSize * 1.6;

let pretextModule = null;
let p1 = null;
let p2 = null;
let lastWidth = 0;

async function initPretext() {
    try {
        // Use dynamic import to catch loading errors
        pretextModule = await import('https://esm.sh/@chenglou/pretext');
        
        // Wait specifically for our font, with a timeout fallback!
        // Sometimes document.fonts.ready hangs forever on mobile if an unrelated font fails to load.
        try {
            await Promise.race([
                document.fonts.load(fontString),
                new Promise(resolve => setTimeout(resolve, 1000))
            ]);
        } catch(e) {
            console.warn("Font loading timeout/error, proceeding with fallback font.");
        }
        
        p1 = pretextModule.prepareWithSegments(text1, fontString);
        p2 = pretextModule.prepareWithSegments(text2, fontString);
        
        renderPretext();
    } catch (e) {
        const canvas = document.getElementById('pretext-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            canvas.width = 300; canvas.height = 100;
            ctx.fillStyle = 'red';
            ctx.font = '12px Arial';
            ctx.fillText("Failed to load Pretext:", 10, 20);
            ctx.fillText(e.message || String(e), 10, 40);
        }
    }
}

function renderPretext() {
    const canvas = document.getElementById('pretext-canvas');
    if (!canvas || !p1 || !p2 || !pretextModule) return;

    const container = canvas.parentElement;
    const containerStyle = window.getComputedStyle(container);
    
    // Get available width
    const availableWidth = container.clientWidth 
                           - parseFloat(containerStyle.paddingLeft) 
                           - parseFloat(containerStyle.paddingRight);

    if (availableWidth <= 0) return;

    // Prevent infinite loop from ResizeObserver triggering on height changes
    if (availableWidth === lastWidth) return;

    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext('2d');
    
    // Calculate layout for both paragraphs
    const layout1 = pretextModule.layoutWithLines(p1, availableWidth, lineHeight);
    const layout2 = pretextModule.layoutWithLines(p2, availableWidth, lineHeight);

    const gapBetweenParagraphs = 20; 
    const totalHeight = (layout1.lines.length * lineHeight) + gapBetweenParagraphs + (layout2.lines.length * lineHeight);

    // Update canvas dimensions
    canvas.width = availableWidth * dpr;
    canvas.height = totalHeight * dpr;
    canvas.style.width = `${availableWidth}px`;
    canvas.style.height = `${totalHeight}px`;
    canvas.style.display = 'block';

    lastWidth = availableWidth;

    // High DPI scaling
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, availableWidth, totalHeight);

    // Styling
    ctx.fillStyle = '#888888';
    ctx.font = fontString;
    ctx.textBaseline = 'top';

    let currentY = 0;

    // Draw paragraph 1
    for (let i = 0; i < layout1.lines.length; i++) {
        ctx.fillText(layout1.lines[i].text, 0, currentY);
        currentY += lineHeight;
    }

    currentY += gapBetweenParagraphs;

    // Draw paragraph 2
    for (let i = 0; i < layout2.lines.length; i++) {
        ctx.fillText(layout2.lines[i].text, 0, currentY);
        currentY += lineHeight;
    }
}

// Start initialization
initPretext();

// Robust resize handling
const observer = new ResizeObserver(() => {
    requestAnimationFrame(renderPretext);
});

const canvas = document.getElementById('pretext-canvas');
if (canvas && canvas.parentElement) {
    observer.observe(canvas.parentElement);
}
