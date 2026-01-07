export const generateQR = () => {
    //generate a random 20 digit code that includes numbers and letters and special characters
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?';
    let qrCode = '';
    for (let i = 0; i < 20; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        qrCode += characters[randomIndex];
    }
    return qrCode;
}