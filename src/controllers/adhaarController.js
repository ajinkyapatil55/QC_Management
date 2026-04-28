const axios = require("axios");
const pool = require("../config/db");
const gst = require("../config/GstApiSecretsDto");

/* =========================
   DB HELPERS
========================= */
const getApiToken = async (owner_id) => {
  const [[row]] = await pool.query(
    "SELECT * FROM api_token WHERE owner_id=? ORDER BY id DESC LIMIT 1",
    [owner_id]
  );
  return row;
};

const saveOrUpdateToken = async (token, owner_id) => {
  const existing = await getApiToken(owner_id);
  if (existing) {
    await pool.query(
      "UPDATE api_token SET token=? WHERE owner_id=?",
      [token, owner_id]
    );
  } else {
    await pool.query(
      "INSERT INTO api_token (token, owner_id) VALUES (?,?)",
      [token, owner_id]
    );
  }
};

/* =========================
   SEND AADHAAR OTP
========================= */
exports.sendAadhaarOtp = async (req, res) => {
  try {
    const { aadhaar_no, owner_id } = req.body;

    /* -------- Generate API Token -------- */
    const authResp = await axios.post(
      "https://api.sandbox.co.in/authenticate",
      {},
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": gst.key,
          "x-api-secret": gst.secret,
          "x-api-version": "1.0",
        },
      }
    );

    const token = authResp.data.access_token;
    if (!token) return res.status(502).send("Token is null");

    await saveOrUpdateToken(token, owner_id);

    /* -------- Send OTP -------- */
    const otpResp = await axios.post(
      "https://api.sandbox.co.in/kyc/aadhaar/okyc/otp",
      {
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.otp.request",
        aadhaar_number: aadhaar_no,
        consent: "Y",
        reason: "get_details",
      },
      {
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
          "x-api-key": gst.key,
          "x-api-version": gst.version,
        },
      }
    );

    const referenceId = otpResp.data?.data?.reference_id;
    return res.status(200).json(referenceId);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Aadhaar OTP Failed");
  }
};

/* =========================
   VERIFY AADHAAR OTP
========================= */
exports.verifyAadhaarOtp = async (req, res) => {
  try {
    const { otp, reference_id, owner_id } = req.body;

    const apiToken = await getApiToken(owner_id);
    if (!apiToken || !apiToken.token) {
      return res.status(502).send("Session Expired or Token Missing");
    }

    const verifyResp = await axios.post(
      "https://api.sandbox.co.in/kyc/aadhaar/okyc/otp/verify",
      {
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.request",
        reference_id,
        otp,
      },
      {
        headers: {
          Authorization: apiToken.token,
          "Content-Type": "application/json",
          "x-api-key": gst.key,
          "x-api-version": gst.version,
        },
      }
    );

    const data = verifyResp.data.data;
    if (!data) return res.status(400).send("Invalid Response");

    // update new access token if returned
    if (data.access_token) {
      await saveOrUpdateToken(data.access_token, owner_id);
    }

    /* -------- Response Mapping (1:1 Java) -------- */
    const response = {
      status: data.status,
      message: data.message,
      reference_id: data.reference_id,
      name: data.name,
      gender: data.gender,
      date_of_birth: data.date_of_birth,
      year_of_birth: data.year_of_birth,
      mobile_hash: data.mobile_hash,
      email_hash: data.email_hash,
      share_code: data.share_code,
      photo: data.photo,
      full_address: data.full_address,
      address: data.address || {},
    };

    res.status(200).json(response);
  } catch (err) {
    console.error(err.response?.data || err.message);
    if (err.response?.status === 403) {
      return res.status(403).send("OTP Verification Failed");
    }
    res.status(500).send("Internal Error");
  }
};
