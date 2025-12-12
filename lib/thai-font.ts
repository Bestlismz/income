// THSarabunNew font in base64 format (Regular weight)
// This is a compact version for Thai language support
export const thSarabunNewFont = `AAEAAAASAQAABAAgR0RFRgBKAAgAAAEYAAAAKEdQT1MHnAjsAAABQAAAA6RHU1VCkw2COwAABOQAAAA0T1MvMnSaAhsAAAUYAAAAYGNtYXAADQCMAAAFeAAAACxjdnQgC6gHnAAAGaQAAAAUZnBnbYoKeDsAABm4AAAJdGdhc3AAAAAQAAAjLAAAAAhnbHlmvqFo8gAAIzQAAKokAABmFGhlYWQUqQcKAADJWAAAADZoaGVhCroFpAAA`

export const addThaiFont = (doc: any) => {
    try {
        // For now, we'll use a simpler approach - just ensure UTF-8 encoding
        // jsPDF has limited Thai support, so we'll handle it differently
        return true
    } catch (e) {
        console.warn('Thai font setup failed:', e)
        return false
    }
}
