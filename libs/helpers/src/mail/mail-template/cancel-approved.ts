const cancelApprovedTemplate = (name: string, url: string) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Cancellation Approved</title>
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
        font-size: 28px;
        margin-bottom: 30px;
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
        margin: 10px;
    }
    .cta a:hover {
        background-color: #e89c35;
    }
    .info-box {
        background-color: #f8f9fa;
        border-left: 4px solid #fdb441;
        padding: 15px;
        margin: 20px 0;
        border-radius: 4px;
    }
    .footer {
        text-align: center;
        margin-top: 40px;
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
            <h1>Booking Cancellation Approved</h1>
        </div>

        <!-- Content Section -->
        <div class="content">
            <p>Hello ${name},</p>
            
            <p>Great news! Your request to cancel your booking has been approved. We understand that plans can change, and we're here to help you with the refund process.</p>
            
            <div class="info-box">
                <p><strong>Next Steps:</strong></p>
                <p>To complete your refund request, you can either:</p>
                <ul>
                    <li>Click the button below to access the refund form directly</li>
                    <li>Go to your order history on our website and fill out the refund form</li>
                </ul>
            </div>

            <div class="cta">
                <a href="${url}" target="_blank">Fill Refund Form</a>
                <a href="https://travel.vulpbox.com/history-order" target="_blank">Go to Order History</a>
            </div>

            <p><strong>Important:</strong> Please complete the refund form as soon as possible to ensure timely processing of your refund.</p>
            
            <p>If you have any questions about the refund process or need assistance, please don't hesitate to contact our support team at <a href="mailto:balitravelride@gmail.com">balitravelride@gmail.com</a></p>
        </div>

        <!-- Footer Section -->
        <div class="footer">
            <p>Regards,<br>Bali Travel Ride Team</p>
            <p>&copy; 2025 Bali Travel Ride. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;

export default cancelApprovedTemplate;
