import express from "express";
import { getDbStatus, peekRecent } from "../controllers/debug.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Protected status (for authenticated debugging)
router.get("/status", protect, getDbStatus);

// Public status (no auth) - useful for local debugging to quickly confirm DB counts
router.get("/public-status", async (req, res) => {
	try {
		const result = await getDbStatus(req, res);
		// getDbStatus already sends a response; ensure we don't send twice
	} catch (err) {
		res.status(500).json({ success: false, message: err?.message || 'error' });
	}
});

// Return some environment info (masked) to help confirm which .env is in use
router.get('/env', async (req, res) => {
	try {
		// getDbStatus uses mongoose and models; this route is lightweight and safe
		const config = await import('../config/config.js');
		const cfg = config.default || config;
		const raw = cfg.mongodb_uri || '';
		const masked = raw ? (raw.length > 20 ? raw.slice(0, 20) + '...' + raw.slice(-10) : raw) : 'NOT_SET';
		return res.status(200).json({ success: true, env: { mongodb_uri_masked: masked, jwt_secret_set: !!cfg.JWT_SECRET, gemini_key_set: !!cfg.GEMINI_API_KEY } });
	} catch (err) {
		console.error('env route error', err && err.message);
		return res.status(500).json({ success: false, message: err?.message || 'error' });
	}
});

// Protected peek: recent documents for quick verification (requires auth)
router.get('/peek', protect, async (req, res) => {
	try {
		return await peekRecent(req, res);
	} catch (err) {
		console.error('peek error', err && err.message);
		return res.status(500).json({ success: false, message: err?.message || 'error' });
	}
});

// Public peek (limited fields) - useful if you want to quickly verify from Postman/frontend
router.get('/peek-public', async (req, res) => {
	try {
		// call peekRecent which already limits fields for users; it's safe for local debugging
		return await peekRecent(req, res);
	} catch (err) {
		console.error('peek-public error', err && err.message);
		return res.status(500).json({ success: false, message: err?.message || 'error' });
	}
});

export default router;
