const registrationTemplate = (name: string) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Customer Account Registration</title>
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
    .content {
        line-height: 1.6;
        font-size: 16px;
        color: #555555;
        text-align: center;
    }
    .content h1 {
        text-align: center;
        color: #333333;
        font-size: 32px;
        margin-bottom: 30px;
    }
    .content p {
        margin: 15px 0;
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
        <div class="content">
            <h1>Ride Bali Explore Account Registration</h1>
            
            <p>Hello ${name}!</p>
            
            <p>Your account has been registered in the Ride Bali Explore service. Now you can log in to the system using your email and password.</p>
            
            <p>If you did not make this request, please contact us immediately at <a href="mailto:ridebaliexplore@gmail.com">ridebaliexplore@gmail.com</a></p>
            
            <div class="footer">
                <p>Regards,<br>Ride Bali Explore Team</p>
            </div>
        </div>
    </div>
</body>
</html>`;

export default registrationTemplate;
