/* ─────────────────────────────────────────
   js/db.js  —  Live Neon DB Helpers
   ───────────────────────────────────────── */

const API_URL = "/invoices"; // Relative path since frontend/backend are on same host

/* No need to "Open" a local DB anymore, but we'll keep the function 
   so app.js doesn't break. We'll just return true. */
async function dbOpen() {
    console.log("Connected to Live API Mode");
    return true;
}

/* Save one invoice record to Neon */
async function dbSave(data) {
    try {
        const response = await fetch(`${API_URL}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || "Failed to save to Neon");
        }

        const result = await response.json();
        // result will contain { "id": X, "invoice_no": "INV-XXXX" }
        return result; 
    } catch (error) {
        console.error("Save Error:", error);
        throw error;
    }
}

/* Load all invoice records from Neon */
async function dbAll() {
    try {
        const response = await fetch(`${API_URL}/`);
        if (!response.ok) throw new Error("Could not fetch history");
        return await response.json();
    } catch (error) {
        console.error("Fetch Error:", error);
        return []; // Return empty list on error to prevent UI crash
    }
}

/* Load one invoice by id from Neon */
async function dbGet(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) {
            let detail = "";
            try {
                const err = await response.json();
                detail = err.detail ? ` (${err.detail})` : "";
            } catch (e) {}
            throw new Error(`Could not fetch invoice${detail}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Fetch One Error:", error);
        throw error;
    }
}

/* Delete one invoice by id from Neon */
async function dbDelete(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error("Could not delete invoice");
        return true;
    } catch (error) {
        console.error("Delete Error:", error);
        throw error;
    }
}
