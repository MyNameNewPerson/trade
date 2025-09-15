declare module 'qrcode.js' {
  interface QRCodeOptions {
    text: string;
    width?: number;
    height?: number;
    colorDark?: string;
    colorLight?: string;
    correctLevel?: QRCode.CorrectLevel;
  }

  class QRCode {
    constructor(element: HTMLElement, options: QRCodeOptions);
    
    static CorrectLevel: {
      L: number;
      M: number;
      Q: number;
      H: number;
    };
  }

  export = QRCode;
}