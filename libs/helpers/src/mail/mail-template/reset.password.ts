const resetPasswordTemplate = (url: string) => `<!DOCTYPE html>
<html lang="en">
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
        <h1>Reset Your Password</h1>
    </div>

    <!-- Content Section -->
    <div class="content">
        <p>Hello,</p>
        <p>You have requested to reset your account password. Click the button below to reset your password:</p>
        <div class="cta">
        <a href="${url}" target="_blank">Reset Password</a>
        </div>
        <p><strong>Note:</strong> This email is confidential and should only be used by you. Do not share this link with anyone for your account security.</p>
        <p>If you did not request this password reset, please ignore this email or contact our support team.</p>
    </div>

    <!-- Footer Section -->
    <div class="footer">
        <p>&copy; 2025 Ride Bali Explore. All rights reserved.</p>
    </div>
    </div>
</body>
</html>`;

export default resetPasswordTemplate;
