// Custom fonts configuration for pdfmake with Thai support
// Using Google Fonts CDN for Sarabun (Thai font)

export const customFonts = {
    Sarabun: {
        normal: 'https://fonts.gstatic.com/s/sarabun/v13/DtVjJx26TKEr37c9YHZJmnYI5gnOpg.woff2',
        bold: 'https://fonts.gstatic.com/s/sarabun/v13/DtVmJx26TKEr37c9YNpoulwm6gDXvwE.woff2',
        italics: 'https://fonts.gstatic.com/s/sarabun/v13/DtVhJx26TKEr37c9aBBx_nwMxAzepjPt.woff2',
        bolditalics: 'https://fonts.gstatic.com/s/sarabun/v13/DtVnJx26TKEr37c9aBBx3ljUoZLgpjPtOUo.woff2'
    }
}

export const pdfMakeConfig = {
    defaultStyle: {
        font: 'Sarabun'
    }
}
