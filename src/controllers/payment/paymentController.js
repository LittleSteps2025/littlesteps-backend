import crypto from "crypto";
import pool from "../../config/db.js";
import { getPaymentsHistory, getParentPaymentsHistory } from "../../models/payment/paymentModel.js";
import dotenv from "dotenv";
dotenv.config();

// PayHere credentials from environment variables
const MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID || ""; // from your dashboard
const MERCHANT_SECRET = process.env.PAYHERE_SECRET || ""; // from your dashboard

// Format amount for PayHere (two decimals)
const formatAmount = (val) => {
  const num = typeof val === "number" ? val : parseFloat(String(val));
  return num.toFixed(2);
};

// Generate md5sig for PayHere (checkout page) - EXACT PayHere documentation format
const generateCheckoutHash = ({ merchant_id, order_id, amount, currency }) => {
  // Format amount exactly as PayHere expects: number_format($amount, 2, '.', '')
  const formattedAmount = parseFloat(amount).toFixed(2);
  
  // Debug: Log the merchant secret being used
  console.log("[PayHere][Debug] Merchant Secret:", MERCHANT_SECRET);
  console.log("[PayHere][Debug] Merchant Secret Length:", MERCHANT_SECRET.length);
  
  // Step 1: Generate MD5 of merchant secret and convert to uppercase
  // strtoupper(md5($merchant_secret))
  const merchantSecretHash = crypto
    .createHash("md5")
    .update(MERCHANT_SECRET)
    .digest("hex")
    .toUpperCase();

  // Step 2: Concatenate: merchant_id + order_id + amount + currency + merchantSecretHash
  const raw = merchant_id + order_id + formattedAmount + currency + merchantSecretHash;

  // Step 3: Generate final hash and convert to uppercase
  // strtoupper(md5(...))
  const hash = crypto.createHash("md5").update(raw).digest("hex").toUpperCase();

  // Debug: Log hash generation details exactly as PayHere docs
  console.log("[PayHere][Hash Debug - PayHere Format]", {
    merchant_id,
    order_id,
    formattedAmount,
    currency,
    merchantSecretHash,
    raw,
    finalHash: hash,
    phpEquivalent: `strtoupper(md5("${raw}"))`
  });

  return { hash, formattedAmount };
};


// 👉 Notify URL endpoint (PayHere → your server)
export const notify = async (req, res) => {
  const data = req.body;
  console.log("PayHere Notify Data:", data);

  const {
    merchant_id,
    order_id,
    payhere_amount,
    payhere_currency,
    status_code,
    md5sig,
  } = data;

  const formattedPayHereAmount = formatAmount(payhere_amount);

  // For notification verification, use the same format as checkout
  const merchantSecretHash = crypto
    .createHash("md5")
    .update(MERCHANT_SECRET)
    .digest("hex")
    .toUpperCase();

  // PayHere notification hash format: merchant_id + order_id + amount + currency + status_code + md5(merchant_secret)
  const verifyRaw =
    merchant_id +
    order_id +
    formattedPayHereAmount +
    payhere_currency +
    status_code +
    merchantSecretHash;

  const local_md5sig = crypto
    .createHash("md5")
    .update(verifyRaw)
    .digest("hex")
    .toUpperCase();

  console.log("[PayHere][Notify][Debug]", {
    merchant_id,
    order_id,
    formattedPayHereAmount,
    payhere_currency,
    status_code,
    merchantSecretHash,
    verifyRaw,
    local_md5sig,
    md5sig_received: md5sig,
    match: local_md5sig === md5sig,
    phpEquivalent: `strtoupper(md5("${verifyRaw}"))`
  });

  if (local_md5sig === md5sig && status_code == 2) {
    console.log("✅ Payment VERIFIED for order:", order_id);
    try {
      await pool.query(
        "UPDATE payments SET status=$1, paid_at=NOW() WHERE order_id=$2",
        ["paid", order_id]
      );
    } catch (err) {
      console.error("DB Update Error:", err);
    }
  } else {
    console.log("❌ Payment verification failed or payment not successful.");
    await pool.query(
      "UPDATE test_payments SET status=$1 WHERE order_id=$2",
      ["failed", order_id]
    );
  }

  res.sendStatus(200);
};

// PayHere Success Page
export const paymentSuccess = async (req, res) => {
  const { order_id, payment_id, status_code } = req.query;
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Successful - LittleSteps</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                margin: 0;
                padding: 20px;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container {
                background: white;
                padding: 40px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                text-align: center;
                max-width: 500px;
                width: 100%;
            }
            .success-icon {
                color: #4CAF50;
                font-size: 64px;
                margin-bottom: 20px;
            }
            h1 {
                color: #333;
                margin-bottom: 20px;
                font-size: 28px;
            }
            .details {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
                border-left: 4px solid #4CAF50;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
                padding: 5px 0;
                border-bottom: 1px solid #eee;
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .label {
                font-weight: 600;
                color: #666;
            }
            .value {
                color: #333;
                font-weight: 500;
            }
            .btn {
                background: #4CAF50;
                color: white;
                padding: 12px 30px;
                border: none;
                border-radius: 25px;
                font-size: 16px;
                cursor: pointer;
                margin-top: 20px;
                text-decoration: none;
                display: inline-block;
                transition: background 0.3s ease;
            }
            .btn:hover {
                background: #45a049;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="success-icon">✅</div>
            <h1>Payment Successful!</h1>
            <p>Thank you for your payment. Your tuition fee has been processed successfully.</p>
            
            <div class="details">
                <div class="detail-row">
                    <span class="label">Order ID:</span>
                    <span class="value">${order_id || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Payment ID:</span>
                    <span class="value">${payment_id || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Status:</span>
                    <span class="value">Completed</span>
                </div>
                <div class="detail-row">
                    <span class="label">Date:</span>
                    <span class="value">${new Date().toLocaleDateString()}</span>
                </div>
            </div>
            
            <a href="#" class="btn" onclick="window.close()">Close Window</a>
        </div>
        
        <script>
            // Auto-close window after 10 seconds
            setTimeout(() => {
                window.close();
            }, 10000);
            
            // Try to send message to parent window (React Native WebView)
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'payment_success_page',
                    order_id: '${order_id || ''}',
                    payment_id: '${payment_id || ''}'
                }));
            }
        </script>
    </body>
    </html>
  `);
};

// PayHere Cancel Page
export const paymentCancel = async (req, res) => {
  const { order_id } = req.query;
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Cancelled - LittleSteps</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #ff7b7b 0%, #ff6b6b 100%);
                margin: 0;
                padding: 20px;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container {
                background: white;
                padding: 40px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                text-align: center;
                max-width: 500px;
                width: 100%;
            }
            .cancel-icon {
                color: #ff6b6b;
                font-size: 64px;
                margin-bottom: 20px;
            }
            h1 {
                color: #333;
                margin-bottom: 20px;
                font-size: 28px;
            }
            .details {
                background: #fff5f5;
                padding: 20px;
                border-radius: 10px;
                margin: 20px 0;
                border-left: 4px solid #ff6b6b;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
                padding: 5px 0;
                border-bottom: 1px solid #fee;
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .label {
                font-weight: 600;
                color: #666;
            }
            .value {
                color: #333;
                font-weight: 500;
            }
            .btn-group {
                margin-top: 20px;
            }
            .btn {
                padding: 12px 30px;
                border: none;
                border-radius: 25px;
                font-size: 16px;
                cursor: pointer;
                margin: 5px;
                text-decoration: none;
                display: inline-block;
                transition: all 0.3s ease;
            }
            .btn-primary {
                background: #4CAF50;
                color: white;
            }
            .btn-primary:hover {
                background: #45a049;
            }
            .btn-secondary {
                background: #f8f9fa;
                color: #333;
                border: 2px solid #ddd;
            }
            .btn-secondary:hover {
                background: #e9ecef;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="cancel-icon">❌</div>
            <h1>Payment Cancelled</h1>
            <p>Your payment has been cancelled. No charges have been made to your account.</p>
            
            <div class="details">
                <div class="detail-row">
                    <span class="label">Order ID:</span>
                    <span class="value">${order_id || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Status:</span>
                    <span class="value">Cancelled</span>
                </div>
                <div class="detail-row">
                    <span class="label">Date:</span>
                    <span class="value">${new Date().toLocaleDateString()}</span>
                </div>
            </div>
            
            <div class="btn-group">
                <a href="#" class="btn btn-primary" onclick="retryPayment()">Try Again</a>
                <a href="#" class="btn btn-secondary" onclick="window.close()">Close</a>
            </div>
        </div>
        
        <script>
            function retryPayment() {
                // Send message to parent window to retry payment
                if (window.ReactNativeWebView) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'payment_retry',
                        order_id: '${order_id || ''}'
                    }));
                }
                window.close();
            }
            
            // Auto-close window after 15 seconds
            setTimeout(() => {
                window.close();
            }, 15000);
            
            // Send cancel message to parent window
            if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'payment_cancel_page',
                    order_id: '${order_id || ''}'
                }));
            }
        </script>
    </body>
    </html>
  `);
};

// 👉 API to create an order before payment
export const create = async (req, res) => {
  try {
    const { child_id, parent_email, amount } = req.body;
    if (!child_id || !parent_email || !amount) {
      return res
        .status(400)
        .json({ error: "child_id, parent_email and amount are required" });
    }

    const order_id = "ORDER_" + Date.now();
    const currency = "LKR";

    const { hash, formattedAmount } = generateCheckoutHash({
      merchant_id: MERCHANT_ID,
      order_id,
      amount,
      currency,
    });

    // Save pending payment in DB
    await pool.query(
      "INSERT INTO payments (order_id, child_id, parent_email, amount, status) VALUES ($1, $2, $3, $4, $5)",
      [order_id, child_id, parent_email, formattedAmount, "pending"]
    );

    res.json({
      sandbox: true,
      merchant_id: MERCHANT_ID,
      order_id,
      amount: formattedAmount,
      currency,
      hash,
      first_name: "Parent",
      last_name: "User",
      email: parent_email,
      phone: "0712345678",
      address: "Colombo",
      city: "Colombo",
      country: "Sri Lanka",
      delivery_address: "Colombo",
      delivery_city: "Colombo",
      delivery_country: "Sri Lanka",
      return_url: "http://localhost:5001/api/payment/success",
      cancel_url: "http://localhost:5001/api/payment/cancel",
      notify_url: "http://localhost:5001/api/payment/notify",
      items: "Tuition Fee",
    });
  } catch (err) {
    console.error("DB Insert Error:", err);
    res.status(500).json({ error: "Database insert failed" });
  }
};

export const getHistory = async (req, res) => {
    try {
        const { child_id } = req.params;
        const result = await getPaymentsHistory(child_id);
        res.json(result);
    } catch (err) {
        console.error("Error fetching payment history:", err);
        res.status(500).json({ error: "Failed to fetch payment history" });
    }
};

// Get payment history for all children of a parent
export const getParentPaymentHistory = async (req, res) => {
    try {
        const { parent_email } = req.params;
        const result = await getParentPaymentsHistory(parent_email);
        res.json(result);
    } catch (err) {
        console.error("Error fetching parent payment history:", err);
        res.status(500).json({ error: "Failed to fetch payment history" });
    }
};