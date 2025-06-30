const resetPasswordTemplate = (url: string) => `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password</title>
    <style>
    body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f9f9ff;
        color: #000000;
    }
    .container {
        max-width: 600px;
        margin: 0 auto;
        background: #ffffff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    .header {
        text-align: center;
        padding: 20px;
    }
    .header img {
        width: 80px;
        margin-bottom: 20px;
    }
    .content {
        line-height: 1.6;
        font-size: 16px;
        color: #555555;
    }
    .content h1 {
        text-align: center;
        color: #333333;
    }
    .content p {
        margin: 15px 0;
    }
    .cta {
        text-align: center;
        margin: 30px 0;
    }
    .cta a {
        text-decoration: none;
        color: #ffffff;
        background-color: #fdb441;
        padding: 12px 24px;
        border-radius: 25px;
        font-size: 16px;
        display: inline-block;
    }
    .cta a:hover {
        background-color: #e89c35;
    }
    .footer {
        text-align: center;
        margin-top: 60px;
        font-size: 14px;
        color: #888888;
    }
    .footer a {
        color: #0000ee;
        text-decoration: none;
    }
    </style>
</head>
<body>
    <div class="container">
    <!-- Header Section -->
    <div class="header">
        <img src="cid:lockIcon" alt="Reset Password Icon" />
        <h1>Reset Password Anda</h1>
    </div>

    <!-- Content Section -->
    <div class="content">
        <p>Halo,</p>
        <p>Anda telah meminta untuk mereset kata sandi akun Anda. Klik tombol di bawah ini untuk mengatur ulang kata sandi Anda:</p>
        <div class="cta">
        <a href="${url}" target="_blank">Reset Password</a>
        </div>
        <p><strong>Catatan:</strong> Tautan ini bersifat rahasia dan hanya boleh digunakan oleh Anda. Jangan bagikan tautan ini kepada siapapun demi keamanan akun Anda.</p>
        <p>Jika Anda tidak meminta reset kata sandi ini, abaikan email ini atau hubungi tim dukungan kami.</p>
    </div>

    <!-- Footer Section -->
    <div class="footer">
        <p>TourWeb | <a href="https://example.com/privacy">Kebijakan Privasi</a> | <a href="https://example.com/help">Bantuan</a></p>
        <p>&copy; 2024 TourWeb. Semua hak dilindungi.</p>
    </div>
    </div>
</body>
</html>`

export default resetPasswordTemplate;